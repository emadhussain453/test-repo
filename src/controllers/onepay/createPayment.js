import moment from "moment";
import mongoose from "mongoose";
import { CountryCurrencies, ExTypes, Stable, StableActiveCountryCodes, StableCurrencies, StableMaximumUSD, StableMinimumUSD, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
import CashinTransactionsV1 from "../../models/transactionsCashinsV1.js";
import { ApiError } from "../../utils/ApiError.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import callApi from "../../utils/callApi.js";
import applyCurrencyExchangeRateOnAmount from "../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import generateUniqueId from "../../utils/generateUniqueId.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import getFeeAndFeeObject from "../../utils/exchangeRates/getFeeAndObject.js";
import logger from "../../logger/index.js";
import Transactions from "../../models/transactions.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";

async function createPayment(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };
    try {
        const { _id, phoneNumber, kyc, firstName, lastName, email } = req.user;
        const { translate, body: { amount }, userIpAddress } = req;
        const countryCode = kyc?.countryCode;

        if (countryCode !== StableActiveCountryCodes.COL) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        if (!kyc?.documentType || !kyc?.documentIdNumber) {
            throw new ApiError("validation_error", 400, translate("missing_document_details"), true);
        }
        if (typeof amount !== "number" || amount === null) throw new ApiError("Invalid Amount", 400, translate("amount_invalid_numeric"), true);
        if (amount < StableMinimumUSD.CASHIN) throw new ApiError("Invalid Amount", 400, translate("cashin_minimum_amount"), true);
        if (amount > StableMaximumUSD.CASHIN) throw new ApiError("Invalid Amount", 400, translate("cashin_maximum_amount", { amount: StableMaximumUSD.CASHIN }), true);
        const feeObject = await getFeeAndFeeObject(amount, "ONEPAY", "CASHIN", "COL");
        const finalAmountAfterFeeInSUSD = Number(amount) + Number(feeObject.amount);
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Buying, false, 4);
        const exchageRates = await getExchangeRate(CountryCurrencies[countryCode]);
        const oneStableCoin = calculateOneStableCoin(exchangeAmount, amount);
        const apiBody = {
            amount: Number(exchangeAmount),
            title: Stable,
            phone: phoneNumber,
            currency: CountryCurrencies[countryCode],
            customer: {
                document_type: kyc?.d24DocumentType,
                document: kyc?.documentIdNumber,
                first_name: firstName,
                last_name: lastName,
                email,
            },
            expiration_at: moment().add(1, "day").utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ"),
            allow_credit: true,
            allow_debit: false,
            allows: { cards: false, accounts: true, card_extra: false, realtime: false },
        };
        const invoiceId = generateUniqueId("onepay");
        const Headers = {
            accept: "application/json",
            "x-idempotency": invoiceId,
            "content-type": "application/json",
        };
        const result = await callApi.onepay("onepay", "createPayment", "post", apiBody, false, Headers);
        if (!result.success) {
            logger.error(`onePay error :: ${result.message}`);
            throw new ApiError("Error in onePay Api", 400, translate("something_went_wrong"), true);
        }
        const { id } = result.results;
        const { amount: totalAmountFeeAmount, stableFeeDetuction, serviceFeeDetuction } = feeObject;

        const buyingExchangeRate = exchageRates.buying;
        const stableFeeDetuctionLocal = convertToRequiredDecimalPlaces(stableFeeDetuction * buyingExchangeRate);
        const serviceFeeDetuctionLocal = convertToRequiredDecimalPlaces(serviceFeeDetuction * buyingExchangeRate);
        const localAmount = convertToRequiredDecimalPlaces(totalAmountFeeAmount * buyingExchangeRate);

        const time = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
        const statusHistory = [{
            status: Status.PENDING,
            time,
        }];

        const invoivcedata = {
            userId: _id,
            invoiceId,
            depositId: id,
            amount,
            localAmount: exchangeAmount,
            description: Stable,
            status: Status.PENDING,
            statusHistory,
            transactionType: "credit",
            currency: CountryCurrencies[countryCode],
            type: "onepay",
            currentExchangeRate: exchageRates,
            userIpAddress,
            fee: {
                ...feeObject,
                oneStableCoin,
                stableFeeDetuctionLocal,
                serviceFeeDetuctionLocal,
                localAmount,
            },
        };
        const newInvoice = new CashinTransactionsV1(invoivcedata);
        const { _id: tId, localAmount: amountLocal } = newInvoice;
        // save the trantion in consolidatedTrasntions
        const globalTransTable = {
            transactionRefrenceId: tId,
            userId: _id,
            amount,
            status: Status.PENDING,
            transactionModel: StableModelsNames.CASHIN_V1,
            transactionType: `${TransactionTypes.Cashin}|ONEPAY`,
            localAmount: amountLocal,
            metaData: {
                currentExchageRate: exchageRates,
                fee: {
                    amount: totalAmountFeeAmount,
                    localAmount,
                    serviceFee: feeObject.serviceFeeDetuction,
                    stableFee: feeObject.stableFeeDetuction,
                },
            },
        };

        // before adding create a transaction in the database
        const globalData = new Transactions(globalTransTable);

        await globalData.save(opts);
        await newInvoice.save(opts);
        const createdAt = result.results.created_at;
        const responseData = { ...result.results, oneStableCoin, localAmount: exchangeAmount, createdAt };
        await session.commitTransaction();
        session.endSession();
        return sendSuccessResponse(res, 200, true, translate("create_payment_success"), "onepay", responseData);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default createPayment;
