/* eslint-disable camelcase */
import mongoose from "mongoose";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import createAuthHash from "../../../utils/directa24/createAuthHash.js";
import callApi from "../../../utils/callApi.js";
import TransactionsCashIn from "../../../models/directaCashin.js";
import logger from "../../../logger/index.js";
import generateUniqueId from "../../../utils/generateUniqueId.js";
import { DirectaCountryCodes, Status, CountryCurrencies, DirectaMinimumValues, StableCurrencies, DirectaPaymentMethods, ExTypes } from "../../../constants/index.js";
import { ApiError } from "../../../utils/ApiError.js";
import chooseEmailTemplateAndMessage from "../../../utils/chooseTemplateAndMessage.js";
import applyCurrencyExchangeRateOnAmount from "../../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import sendEmailOrMessageV3 from "../../../utils/sendEmailOrMessageV3.js";

async function cashinThroughPSE(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };

    try {
        const { _id, email, firstName, lastName, phoneNumber, kyc } = req.user;
        const { amount, description } = req.body;
        const { translate, userIpAddress } = req;

        let { countryCode } = req.body;
        countryCode = countryCode.toUpperCase();
        // StableFees
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(amount, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Buying);
        const minimumAmount = DirectaMinimumValues.COP.CASHIN;

        if (exchangeAmount < minimumAmount) throw new ApiError("Invalid Amount", 400, `minimum value you can cashin is ${minimumAmount} PSO or 2.5 USD`, true);
        const directaPaymentMethodForCountries_Obj = DirectaPaymentMethods[countryCode];
        if (!Object.keys(DirectaCountryCodes).includes(countryCode.toUpperCase())) {
            const allowedCountryCodes = `[${Object.keys(DirectaCountryCodes)}]`;
            throw new ApiError("validation_error", 400, translate("allowed_country_codes", { codes: allowedCountryCodes }), true);
        }

        if (!Object.keys(directaPaymentMethodForCountries_Obj).includes("PSE")) {
            const allowedPaymentMethods = `[${Object.keys(directaPaymentMethodForCountries_Obj)}]`;
            throw new ApiError("Validation error", 400, translate("allowed_payment_methods", { methods: allowedPaymentMethods, countryCode }), true);
        }

        // as i am getting currency in stable usd and user is from colombia then i have to convert stableusd to cop first and then sent them to directa24
        console.info({ exchangeAmount });
        const invoiceId = generateUniqueId("cashin");
        const apiBody = {
            invoice_id: invoiceId,
            amount: `${exchangeAmount}`,
            country: DirectaCountryCodes[countryCode],
            currency: CountryCurrencies[countryCode],
            payment_method: directaPaymentMethodForCountries_Obj.PSE,
            payer: {
                id: _id,
                document_type: kyc?.d24DocumentType,
                document: kyc?.documentIdNumber, // reuired
                first_name: firstName,
                last_name: lastName,
                email,
                phone: phoneNumber,
            },
            description,
            test: true,
            mobile: false,
            language: "en",

        };
        console.info(apiBody);

        const authHeaders = createAuthHash(apiBody);
        const result = await callApi.callDirecta24Api("directa24CashInThroughPSE", "cashInThorughPSE", "POST", apiBody, false, authHeaders);
        if (!result.success) {
            logger.error(`D24 :: ${result.message}`);
            throw new ApiError("Directa24 Api", 400, translate("something_went_wrong"), true);
        }
        const { deposit_id, redirect_url, payment_info: {
            type,
            payment_method,
            payment_method_name,
            amount: piAmount,
            currency,
            expiration_date,
            created_at,
            metadata: {
                reference,
            },
        } } = result.results;

        const invoivcedata = {
            userId: _id,
            invoiceId,
            depositId: deposit_id,
            amount, // stable usd
            localAmount: exchangeAmount,
            description,
            status: Status.PENDING,
            transactionType: "credit",
            currency,
            type: "PSE",
            userIpAddress,
            redirectUrl: redirect_url,
            paymentInfo: {
                type,
                method: payment_method,
                methodName: payment_method_name,
                amount: piAmount,
                createdAt: created_at,
                expiryDate: expiration_date,
                reference,
            },
        };
        const newInvoice = new TransactionsCashIn(invoivcedata);
        await newInvoice.save(opts);

        await session.commitTransaction();
        session.endSession();

        await sendEmailOrMessageV3({ email: req.user.email, language: req.lng, onEmail: true, emailSubject: "PSE URL", templates: chooseEmailTemplateAndMessage("PSECompletionURL", false, { url: redirect_url }) });

        return sendSuccessResponse(res, 200, true, translate("invoice_created_success"), "cashinPSE", result.results);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default cashinThroughPSE;
