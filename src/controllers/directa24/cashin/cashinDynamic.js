/* eslint-disable camelcase */
import mongoose from "mongoose";
import moment from "moment";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import createAuthHash from "../../../utils/directa24/createAuthHash.js";
import callApi from "../../../utils/callApi.js";
import logger from "../../../logger/index.js";
import generateUniqueId from "../../../utils/generateUniqueId.js";
import { DirectaCountryCodes, Status, CountryCurrencies, StableCurrencies, DirectaPaymentMethods, ExTypes, DirectaCardPaymentMethods, Lenguages, StableActiveCountryCodes, StableModelsNames, TransactionTypes, Applications } from "../../../constants/index.js";
import { ApiError } from "../../../utils/ApiError.js";
import chooseEmailTemplateAndMessage from "../../../utils/chooseTemplateAndMessage.js";
import Users from "../../../models/users.js";
import getFeeObjectForCashin from "../../../utils/exchangeRates/calculateFeeForDirectaCashin.js";
import applyCurrencyExchangeRateOnAmount from "../../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import calculateOneStableCoin from "../../../utils/calculateOneStableCoin.js";
import CashinTransactionsV1 from "../../../models/transactionsCashinsV1.js";
import convertToRequiredDecimalPlaces from "../../../utils/convertToRequiredDecimalPlaces.js";
import capitalizeName from "../../../utils/capitalizeName.js";
import sendEmailOrMessageV3 from "../../../utils/sendEmailOrMessageV3.js";
import Transactions from "../../../models/transactions.js";
import getExchangeRate from "../../../utils/exchangeRates/getExchangeRate.js";
import getAppConfig from "../../../utils/getAppConfig.js";

async function cashinDynamic(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };

    try {
        const { translate } = req;
        const { _id, email, firstName, language: userLanguage, lastName, userName: name, phoneNumber, kyc, country } = req.user;
        const { amount, description, methodName, address } = req.body;
        const { userIpAddress } = req;

        if (!kyc?.d24DocumentType || !kyc?.documentIdNumber) {
            throw new ApiError("validation_error", 400, translate("missing_document_details"), true);
        }

        const countryCode = kyc?.countryCode;
        if (countryCode !== StableActiveCountryCodes.COL && countryCode !== StableActiveCountryCodes.MEX) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        const directaPaymentMethodForCountries_Obj = DirectaPaymentMethods[countryCode];
        if (!Object.keys(DirectaCountryCodes).includes(countryCode)) {
            const allowedCountryCodes = `[${Object.keys(DirectaCountryCodes)}]`;
            throw new ApiError("validation_error", 400, translate("allowed_country_codes", { codes: allowedCountryCodes }), true);
        }
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        if (amount < app.cashin.minLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_minimum_amount", { amount: app.cashin.minLimit }), true);
        if (amount > app.cashin.maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_maximum_amount", { amount: app.cashin.maxLimit }), true);

        const isCardPayment = DirectaCardPaymentMethods[countryCode].includes(DirectaPaymentMethods[countryCode][methodName]);
        if (!Object.keys(directaPaymentMethodForCountries_Obj).includes(methodName.toUpperCase())) {
            const allowedPaymentMethods = `[${Object.keys(directaPaymentMethodForCountries_Obj)}]`;
            throw new ApiError("Validation error", 400, translate("allowed_payment_methods", { methods: allowedPaymentMethods, countryCode }), true);
        }

        if (!address && isCardPayment) {
            throw new ApiError("Validation error", 400, translate("address_required"), true);
        }
        if (typeof address !== "object" && isCardPayment) {
            throw new ApiError("Validation error", 400, translate("address_type_error"), true);
        }
        if (isCardPayment && Object.keys(address).length <= 0) {
            throw new ApiError("Validation error", 400, translate("address_required"), true);
        }
        const feeObject = await getFeeObjectForCashin(amount, "DIRECTA24", "CASHIN", countryCode, isCardPayment);
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
            payment_method: directaPaymentMethodForCountries_Obj[methodName],
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
            client_ip: req.headers["x-forwarded-for"],
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
            type: methodName,
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
            fee: {
                ...feeObject,
                oneStableCoin: calculateOneStableCoin(exchangeAmount, amount),
                stableFeeDetuctionLocal: convertToRequiredDecimalPlaces(stableFeeDetuction * buyingExchangeRate),
                serviceFeeDetuctionLocal: convertToRequiredDecimalPlaces(serviceFeeDetuction * buyingExchangeRate),
                localAmount: convertToRequiredDecimalPlaces(totalAmountFeeAmount * buyingExchangeRate),
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
            transactionType: `${TransactionTypes.Cashin}|${methodName.toUpperCase()}`,
            localAmount: amountLocal,
            metaData: {
                currentExchageRate: exchageRates,
                fee: {
                    amount: feeObject.amount,
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
        if (isCardPayment) {
            await Users.updateOne({ _id }, { address });
        }

        return sendSuccessResponse(res, 200, true, translate("invoice_created_success"), "cashinDynamic", result.results);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}

export default cashinDynamic;
