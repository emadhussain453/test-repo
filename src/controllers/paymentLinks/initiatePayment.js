/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
import moment from "moment";
import getCountryISO2 from "country-iso-3-to-2";
import mongoose from "mongoose";
import PaymentLinks from "../../models/paymentLinks.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import { Applications, CountryCurrencies, ExTypes, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
import generateUniqueId from "../../utils/generateUniqueId.js";
import createAuthHash from "../../utils/directa24/createAuthHash.js";
import callApi from "../../utils/callApi.js";
import logger from "../../logger/index.js";
import { ApiError } from "../../utils/ApiError.js";
import getFeeObjectForCashin from "../../utils/exchangeRates/calculateFeeForDirectaCashin.js";
import applyCurrencyExchangeRateOnAmount from "../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import CashinTransactionsV1 from "../../models/transactionsCashinsV1.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import getStatusHistoryObject from "../../utils/getStatusHistoryObject.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import getLanguage from "../../utils/getLanguage.js";
import Transactions from "../../models/transactions.js";
import FeeTransactions from "../../models/feeTransaction.js";
import Wallet from "../../models/feeWallet.js";

const documentsTypes = {
    COL: {
        ID_CARD: "CC",
        PASSPORT: "PASS",
        DRIVING_LICENSE: "CC",
    },
    MEX: {
        PASSPORT: "PASS",
        ID_CARD: "CURP",
        IFE: "IFE",
    },
};
async function initiatePayment(req, res, next) {
    let session;
    try {
        const { params: { plId }, body: { payerPersonalDetails, payerPaymentDetails }, t: translate } = req;

        if (!plId) throw new ApiError("payment_link", 400, translate("payment_link_id_required"), true);
        if (!isValidMdbId(plId)) throw new ApiError("validation_error", 400, translate("payment_link_id_invalid"), true);
        const { firstName, lastName, email, documentIdNumber, documentType } = payerPersonalDetails || {};
        const { countryCode, paymentMethod } = payerPaymentDetails || {};
        const documentTypeMethod = documentsTypes[countryCode];
        if (!Object.values(documentTypeMethod).includes(documentType)) {
            const allowedDocumentsType = `[${Object.keys(documentTypeMethod)}]`;
            throw new ApiError("Validation error", 400, translate("invalid_document_type", { allowedDocumentsType, countryCode }), true);
        }

        const allowedPaymentMethods = {
            COL: "PC",
            MEX: "SE",
        };

        const paymentMethodName = {
            PC: "PSE",
            SE: "SPEI",
        };

        if (!allowedPaymentMethods[countryCode] || allowedPaymentMethods[countryCode] !== paymentMethod) throw new ApiError("payment_method", 400, translate("invalid_payment_method", { countryCode, allowedPaymentMethods: allowedPaymentMethods[countryCode] }), true);

        // check if plid exists
        const isPaymentLink = await PaymentLinks.findOne({ _id: plId });
        if (!isPaymentLink) throw new ApiError("payment_link", 400, translate("payment_link_not_exist"), true);

        // Check if payment link is valid
        const { status, expiresAt, amount, description, userId: pluid } = isPaymentLink;
        const currentUTC = moment().utc();
        const expirationDate = moment(expiresAt).utc();

        if (status === Status.COMPLETED) {
            throw new ApiError("payment_link", 400, translate("payment_link_already_completed"), true);
        } else if (status !== Status.PENDING) {
            throw new ApiError("payment_link", 400, translate("payment_link_in_progress"), true);
        } else if (!expirationDate.isAfter(currentUTC)) {
            const updateQueryPl = {
                $set: { status: Status.EXPIRED },
                $push: { statusHistory: getStatusHistoryObject(Status.EXPIRED, true) },
            };
            await PaymentLinks.updateOne({ _id: plId }, updateQueryPl);
            throw new ApiError("payment_link", 400, translate("payment_link_expired"), true);
        }

        // process the payment_link as it is valid now
        const currency = CountryCurrencies[countryCode];
        const feeObject = await getFeeObjectForCashin(amount, "DIRECTA24", "CASHIN", countryCode, false);
        const { amount: totalAmountFeeAmount, stableFeeDetuction, serviceFeeDetuction } = feeObject;
        const finalAmountAfterFeeInSUSD = amount + totalAmountFeeAmount;
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, currency, ExTypes.Buying, false, 2);

        const exRate = await getExchangeRate(currency);
        const CC2Digit = getCountryISO2(countryCode);

        const invoiceId = generateUniqueId("cashin");
        const payloadForD24 = {
            invoice_id: invoiceId,
            amount: exchangeAmount.toString(),
            country: CC2Digit,
            currency,
            payment_method: paymentMethod,
            payer: {
                document_type: documentType,
                document: documentIdNumber, // must be validated
                first_name: firstName,
                last_name: lastName,
                email,
            },
            description,
            mobile: true,
            language: getLanguage(req.headers["accept-language"]),
            client_ip: req.headers["x-forwarded-for"],
        };
        const authHeaders = createAuthHash(payloadForD24);
        const result = await callApi.callDirecta24Api("directa24CashInThroughPSE", "cashInThorughPSE", "POST", payloadForD24, false, authHeaders);
        if (!result.success) {
            logger.error(`D24 :: ${result.message}`);
            throw new ApiError("Directa24 api error", 400, result.message, true);
        }

        const { deposit_id, redirect_url, payment_info: {
            type,
            payment_method,
            payment_method_name,
            amount: piAmount,
            expiration_date,
            created_at,
        } } = result.results;

        const buyingExchangeRate = exRate.buying;

        // now save that in transation_cashin table
        const invoivcedata = {
            userId: pluid,
            invoiceId,
            depositId: deposit_id,
            amount,
            localAmount: exchangeAmount,
            description,
            status: Status.PENDING,
            statusHistory: getStatusHistoryObject(Status.PENDING, true),
            transactionType: "credit",
            currency,
            type: paymentMethodName[paymentMethod],
            redirectUrl: redirect_url,
            currentExchangeRate: exRate,
            paymentInfo: {
                type,
                method: payment_method,
                methodName: payment_method_name,
                amount: piAmount,
                createdAt: created_at,
                expiryDate: expiration_date,
            },
            fee: {
                ...feeObject,
                oneStableCoin: calculateOneStableCoin(exchangeAmount, amount),
                stableFeeDetuctionLocal: convertToRequiredDecimalPlaces(stableFeeDetuction * buyingExchangeRate),
                serviceFeeDetuctionLocal: convertToRequiredDecimalPlaces(serviceFeeDetuction * buyingExchangeRate),
                localAmount: convertToRequiredDecimalPlaces(totalAmountFeeAmount * buyingExchangeRate),
            },
            paymentLinkRefranceId: plId,
        };
        const newInvoice = new CashinTransactionsV1(invoivcedata);
        // save the trantion in consolidatedTrasntions
        const { _id: tId, localAmount: amountLocal } = newInvoice;
        const globalTransTable = {
            transactionRefrenceId: tId,
            userId: pluid,
            amount,
            status: Status.PENDING,
            transactionModel: StableModelsNames.CASHIN_V1,
            transactionType: `${TransactionTypes.Cashin}|${paymentMethodName[paymentMethod]}`,
            localAmount: amountLocal,
            metaData: {
                currentExchageRate: exRate,
                fee: {
                    amount: totalAmountFeeAmount,
                    oneStableCoin: calculateOneStableCoin(exchangeAmount, amount),
                    localAmount: convertToRequiredDecimalPlaces(totalAmountFeeAmount * buyingExchangeRate),
                    serviceFee: serviceFeeDetuction,
                    stableFee: stableFeeDetuction,
                },
            },
        };
        const globalData = new Transactions(globalTransTable);

        // start the MDB transation
        session = await mongoose.startSession();
        session.startTransaction();
        const opts = { session, new: true };

        await newInvoice.save(opts);
        await globalData.save(opts);

        // now update the status of payment_link to inprogress
        const updateQueryPl = {
            $set: {
                status: Status.INPROGRESS,
                serviceCheckoutURL: redirect_url,
                payerPersonalDetails: {
                    firstName,
                    lastName,
                    email,
                    documentType,
                    documentIdNumber,
                },
            },
            $push: { statusHistory: getStatusHistoryObject(Status.INPROGRESS, true) },
        };

        await PaymentLinks.updateOne({ _id: plId }, updateQueryPl, opts);
        await session.commitTransaction();
        session.endSession();
        const finalPayload = {
            checkOutLink: redirect_url,
        };
        return sendSuccessResponse(res, 200, true, translate("payment_link_inititated_successfully"), "initiatePaymentLink", finalPayload);
    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        return next(error);
    }
}

export default initiatePayment;
