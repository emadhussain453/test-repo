/* eslint-disable camelcase */
import moment from "moment";
import mongoose from "mongoose";
import { arrayofRequiredFields, CountryCurrencies, DirectaCountryCodes, ExTypes, Lenguages, Stable, StableActiveCountryCodes, StableCurrencies, StableModelsNames, Status, TransactionTypes } from "../../../constants/index.js";
import { ApiError } from "../../../utils/ApiError.js";
import getFeeAndFeeObject from "../../../utils/exchangeRates/getFeeAndObject.js";
import applyCurrencyExchangeRateOnAmount from "../../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import getExchangeRate from "../../../utils/exchangeRates/getExchangeRate.js";
import calculateOneStableCoin from "../../../utils/calculateOneStableCoin.js";
import generateUniqueId from "../../../utils/generateUniqueId.js";
import callApi from "../../../utils/callApi.js";
import logger from "../../../logger/index.js";
import convertToRequiredDecimalPlaces from "../../../utils/convertToRequiredDecimalPlaces.js";
import CashinTransactionsV1 from "../../../models/transactionsCashinsV1.js";
import sendEmailOrMessageV3 from "../../../utils/sendEmailOrMessageV3.js";
import chooseEmailTemplateAndMessage from "../../../utils/chooseTemplateAndMessage.js";
import capitalizeName from "../../../utils/capitalizeName.js";
import createAuthHash from "../../../utils/directa24/createAuthHash.js";
import CheckIfAllRequiredFieldsArePresent from "../../../utils/checkAllRequiredsField.js";
import D24Banks from "../../../models/d24Banks.js";
import getFeeObjectForCashin from "../../../utils/exchangeRates/calculateFeeForDirectaCashin.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import GetD24ExchangeRate from "../../../utils/exchangeRates/getD24ExchangeRate.js";
import Transactions from "../../../models/transactions.js";
import getAppConfig from "../../../utils/getAppConfig.js";
import getFeeAndFeeObjectV1 from "../../../utils/exchangeRates/getFeeAndObjectV1.js";

async function createPayment(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };
    try {
        const { _id, phoneNumber, kyc, country, firstName, lastName, email } = req.user;
        const { translate, body: { amount }, userIpAddress } = req;
        const countryCode = kyc?.countryCode;

        if (countryCode !== StableActiveCountryCodes.COL) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        if (!kyc?.documentType || !kyc?.documentIdNumber) {
            throw new ApiError("validation_error", 400, translate("missing_document_details"), true);
        }
        if (typeof amount !== "number" || amount === null) throw new ApiError("Invalid Amount", 400, translate("amount_invalid_numeric"), true);
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        if (amount < app.cashin.minLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_minimum_amount", { amount: app.cashin.minLimit }), true);
        if (amount > app.cashin.maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_maximum_amount", { amount: app.cashin.maxLimit }), true);
        const feeObject = await getFeeAndFeeObjectV1(amount, "ONEPAY", "CASHIN", "COL");
        const { amount: feeAmount } = feeObject;
        const finalAmountAfterFeeInSUSD = Number(amount) + Number(feeAmount);
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

        let D24ExRates = {};
        try {
            D24ExRates = await GetD24ExchangeRate(countryCode, amount);
        } catch (error) {
            logger.error("D24_Exchange_not_fetcher");
        }
        const D24ExRate = {
            fxRate: D24ExRates.fx_rate,
            currency: D24ExRates.currency,
            convertedAmount: D24ExRates.converted_amount,
        };

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
            D24ExRate,
            fee: {
                ...feeObject,
                oneStableCoin,
                stableFeeDetuctionLocal,
                serviceFeeDetuctionLocal,
                localAmount,
            },
            userIpAddress,
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
                    amount: feeAmount,
                    localAmount,
                    oneStableCoin,
                    serviceFee: feeObject.serviceFeeDetuction,
                    stableFee: feeObject.stableFeeDetuction,
                },
            },
        };
        // before adding create a transaction in the database
        const globalData = new Transactions(globalTransTable);

        await newInvoice.save(opts);
        await globalData.save(opts);
        const createdAt = result.results.created_at;
        const responseData = { ...result.results, oneStableCoin, localAmount: exchangeAmount, createdAt };
        await session.commitTransaction();
        session.endSession();
        return sendSuccessResponse(res, 200, true, translate("invoice_created_success"), "cashinDynamic", responseData);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return next(error);
    }
}

function getUserActiveDeviceId(devices) {
    const loggedInDevice = devices.find((device) => device.loginStatus === true);
    return loggedInDevice ? loggedInDevice.deviceId : null;
}

async function cashinDynamic(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };

    try {
        const { translate } = req;
        const { amount, description: userDescription, bankCode, address } = req.body;
        const { _id, email, firstName, language: userLanguage, lastName, bankStatementVerification, userName: name, phoneNumber, kyc, country, devices } = req.user;
        const { userIpAddress } = req;
        const countryCode = kyc?.countryCode;
        const description = `internal|${userDescription}`;
        if (!kyc?.d24DocumentType || !kyc?.documentIdNumber) {
            throw new ApiError("validation_error", 400, translate("missing_document_details"), true);
        }
        if (typeof amount !== "number" || amount === null) throw new ApiError("Invalid Amount", 400, translate("amount_invalid_numeric"), true);
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        if (!bankStatementVerification && amount >= (app.cashin.verificationRequiredLimit || 1400)) throw new ApiError("Invalid Amount", 400, translate("cashin_document_required_amount", { amount: (app.cashin.verificationRequiredLimit || 1400) }), true);
        if (amount < app.cashin.minLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_minimum_amount", { amount: app.cashin.minLimit }), true);
        if (amount > app.cashin.maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_maximum_amount", { amount: app.cashin.maxLimit }), true);
        if (countryCode !== StableActiveCountryCodes.COL && countryCode !== StableActiveCountryCodes.MEX) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        const errors = CheckIfAllRequiredFieldsArePresent(req.body, arrayofRequiredFields.cashInDynV2);
        if (Object.keys(errors).length > 0) {
            throw new ApiError("Invalid Details", 400, translate("require_fields", { fields: Object.keys(errors) }), true);
        }
        const checkBankCode = await D24Banks.findOne({ countryCode, bankCode: bankCode.toUpperCase() });
        if (!checkBankCode) throw new ApiError("validation_error", 400, translate("invalid_bank_name"), true);
        const feeObject = await getFeeObjectForCashin(amount, "DIRECTA24", "CASHIN", countryCode);
        const { amount: totalAmountFeeAmount, stableFeeDetuction, serviceFeeDetuction } = feeObject;
        const finalAmountAfterFeeInSUSD = amount + feeObject.amount;
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Buying, false, 2);
        const exchageRates = await getExchangeRate(CountryCurrencies[countryCode]);

        const language = req.headers["accept-language"] || userLanguage || Lenguages.English;
        const invoiceId = generateUniqueId("cashin");
        const apiBody = {
            invoice_id: invoiceId,
            amount: exchangeAmount.toString(),
            country: DirectaCountryCodes[countryCode],
            currency: CountryCurrencies[countryCode],
            payment_method: bankCode,
            payer: {
                id: _id,
                document_type: kyc?.d24DocumentType,
                document: kyc?.documentIdNumber,
                first_name: firstName,
                last_name: lastName,
                email,
                phone: phoneNumber,
                address,
            },
            description,
            mobile: false,
            language,
            client_ip: userIpAddress,
            device_id: getUserActiveDeviceId(devices),
        };
        const authHeaders = createAuthHash(apiBody);
        const result = await callApi.callDirecta24Api("directa24CashInThroughPSE", "cashInThorughPSE", "POST", apiBody, false, authHeaders);
        if (!result.success) {
            logger.error(`D24 :: ${result.message}`);
            throw new ApiError("Directa24 api error", 400, translate("something_went_wrong"), true);
        }
        const { deposit_id, redirect_url, payment_info: {
            type,
            payment_method,
            payment_method_name,
            amount: piAmount,
            currency,
            expiration_date,
            created_at,
        } } = result.results;

        const buyingExchangeRate = exchageRates.buying;
        const time = moment().utc();
        const statusHistory = [{
            status: Status.PENDING,
            time,
        }];

        let D24ExRates = {};
        try {
            D24ExRates = await GetD24ExchangeRate(countryCode, amount);
        } catch (error) {
            logger.error("D24_Exchange_not_fetcher");
        }

        const D24ExRate = {
            fxRate: D24ExRates.fx_rate,
            currency: D24ExRates.currency,
            convertedAmount: D24ExRates.converted_amount,
        };
        const invoivcedata = {
            userId: _id,
            invoiceId,
            depositId: deposit_id,
            amount,
            localAmount: exchangeAmount,
            description,
            status: Status.PENDING,
            statusHistory,
            transactionType: "credit",
            currency,
            type: payment_method_name,
            redirectUrl: redirect_url,
            currentExchangeRate: exchageRates,
            userIpAddress,
            paymentInfo: {
                type,
                method: payment_method,
                methodName: payment_method_name,
                amount: piAmount,
                createdAt: created_at,
                expiryDate: expiration_date,
            },
            D24ExRate,
            fee: {
                ...feeObject,
                oneStableCoin: calculateOneStableCoin(exchangeAmount, amount),
                stableFeeDetuctionLocal: convertToRequiredDecimalPlaces(stableFeeDetuction * buyingExchangeRate),
                serviceFeeDetuctionLocal: convertToRequiredDecimalPlaces(serviceFeeDetuction * buyingExchangeRate),
                localAmount: convertToRequiredDecimalPlaces(totalAmountFeeAmount * buyingExchangeRate),
            },
        };
        const newInvoice = new CashinTransactionsV1(invoivcedata);
        // save the trantion in consolidatedTrasntions
        const { _id: tId, localAmount: amountLocal } = newInvoice;
        const globalTransTable = {
            transactionRefrenceId: tId,
            userId: _id,
            amount,
            status: Status.PENDING,
            transactionModel: StableModelsNames.CASHIN_V1,
            transactionType: `${TransactionTypes.Cashin}|${checkBankCode.bankName}`,
            localAmount: amountLocal,
            metaData: {
                currentExchageRate: exchageRates,
                fee: {
                    amount: feeObject.amount,
                    oneStableCoin: calculateOneStableCoin(exchangeAmount, amount),
                    localAmount: convertToRequiredDecimalPlaces(totalAmountFeeAmount * buyingExchangeRate),
                    serviceFee: feeObject.serviceFeeDetuction,
                    stableFee: feeObject.stableFeeDetuction,
                },
            },
        };

        // before adding create a transaction in the database
        const globalData = new Transactions(globalTransTable);

        await newInvoice.save(opts);
        await globalData.save(opts);
        await session.commitTransaction();
        session.endSession();
        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
        const emailTemplate = language === Lenguages.Spanish ? "PSECompletionURLSpanish" : "PSECompletionURL";
        const emailMessage = translate("complete_cashin_process");

        await sendEmailOrMessageV3({ email: req.user.email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Recarga" : "Money added", templates: chooseEmailTemplateAndMessage(emailTemplate, false, { message: emailMessage, url: redirect_url, fullName }) });

        return sendSuccessResponse(res, 200, true, translate("invoice_created_success"), "cashinDynamic", { ...result.results, oneStableCoin: calculateOneStableCoin(exchangeAmount, amount) });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return cashinDynamic;
}

export {
    createPayment,
    cashinDynamic,
};
