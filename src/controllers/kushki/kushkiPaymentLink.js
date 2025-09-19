/* eslint-disable no-restricted-globals */
import moment from "moment";
import PaymentLinks from "../../models/paymentLinks.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import ENV from "../../config/keys.js";
import callApi from "../../utils/callApi.js";
import logger from "../../logger/index.js";
import { CountryCurrencies, ExTypes, StableActiveCountryCodes, StableCurrencies, Status } from "../../constants/index.js";
import getStatusHistoryObject from "../../utils/getStatusHistoryObject.js";
import applyCurrencyExchangeRateOnAmount from "../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import getAppConfig from "../../utils/getAppConfig.js";
import getFeeAndFeeObjectV1 from "../../utils/exchangeRates/getFeeAndObjectV1.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import capitalizeName from "../../utils/capitalizeName.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";

async function createPaymentLink(req, res, next) {
    try {
        const { translate, body: { amount: userAmount } } = req;
        const { _id, kyc, firstName, language, lastName, email, phoneNumber } = req.user;
        const amount = convertToRequiredDecimalPlaces(userAmount);
        if (typeof amount !== "number" || isNaN(amount)) {
            throw new ApiError("Invalid Amount", 400, translate("amount_invalid_numeric"), true);
          }
        const countryCode = kyc?.countryCode;

        if (countryCode !== StableActiveCountryCodes.COL) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        if (!kyc?.documentType || !kyc?.documentIdNumber) {
            throw new ApiError("validation_error", 400, translate("missing_document_details"), true);
        }
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        if (amount < app.cashin.minLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_minimum_amount", { amount: app.cashin.minLimit }), true);
        if (amount > app.cashin.maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_maximum_amount", { amount: app.cashin.maxLimit }), true);
        const feeObject = await getFeeAndFeeObjectV1(amount, "KUSHKI", "CASHIN", "COL");
        const { amount: feeAmount, stableFeeDetuction, serviceFeeDetuction } = feeObject;
        const finalAmountAfterFeeInSUSD = Number(amount) + Number(feeAmount);
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Buying, false, 4);
        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
        const oneStableCoin = calculateOneStableCoin(exchangeAmount, amount);
        const exchageRates = await getExchangeRate(CountryCurrencies[countryCode]);
        const buyingExchangeRate = exchageRates.buying;
        const stableFeeDetuctionLocal = convertToRequiredDecimalPlaces(stableFeeDetuction * buyingExchangeRate);
        const serviceFeeDetuctionLocal = convertToRequiredDecimalPlaces(serviceFeeDetuction * buyingExchangeRate);
        const localAmount = convertToRequiredDecimalPlaces(feeAmount * buyingExchangeRate);
        const Headers = {
            accept: "application/json",
            "content-type": "application/json",
            "private-merchant-id": ENV.KUSKHI.KUSHKI_CASHIN_PRIVATE_KEY,
        };
        const rawExpiry = ENV.PAYMENT_LINK.EXPIRY || "15";
        const expiryMinutes = parseInt(rawExpiry, 10) || 15;
        const apiBody = {
            publicMerchantId: ENV.KUSKHI.KUSHKI_CASHIN_PUBLIC_KEY,
            merchantName: fullName,
            language,
            paymentConfig: {
                paymentType: "unique",
                amount: {
                    currency: "COP",
                    subtotalIva: 0,
                    subtotalIva0: Number(exchangeAmount),
                    iva: 0,
                },
                paymentMethod: [
                    "transfer",
                ],
            },
            generalConfig: {
                productName: "Plan Hogar",
                description: "<p>Cobertura completa</p>",
                productImage: "https://easyemoney-email-template-images.s3.eu-west-2.amazonaws.com/stable-logo.png",
                brandLogo: "https://easyemoney-email-template-images.s3.eu-west-2.amazonaws.com/stable-logo.png",
                executionLimit: 1,
                showTimer: false,
                enabled: true,
                termsAndConditions: "",
                promotionalText: "",
                buyButtonText: "",
                // expirationDate: moment.utc().add(expiryMinutes, "minutes").valueOf(),
            },
            styleAndStructure: {
                structure: "checkout",
            },
            contact: {
                email,
                phoneNumber,
                userId: _id,
            },
            formConfig: [
                {
                    label: "Nombres y apellidos",
                    type: "input",
                    split: false,
                    required: true,
                    disabled: false,
                    name: "nombresyapellidos",
                    placeholder: "Nombres y apellidos",
                },
            ],
        };

        const result = await callApi.kushki("kushki", "createPaymentLink", "post", apiBody, false, Headers);

        if (!result.success) {
            logger.error(`kushki error :: ${result.message}`);
            throw new ApiError("Error in kushki Api", 400, translate("something_went_wrong"), true);
        }
        const url = result.results.smartLinkUrl;
        const id = url.split("/").pop();
        const plPayloadToSave = {
            smartLinkId: id,
            userId: _id,
            amount,
            localAmount: exchangeAmount,
            description: "kushki Payment link",
            exchageRates,
            status: Status.PENDING,
             fee: {
                ...feeObject,
                oneStableCoin,
                stableFeeDetuctionLocal,
                serviceFeeDetuctionLocal,
                localAmount,
            },
            expiresAt: moment.utc().add(15, "minutes"),
            statusHistory: getStatusHistoryObject(Status.PENDING, true),
        };

        await PaymentLinks.create(plPayloadToSave);
        const finalPayload = {
            paymentLink: result.results.smartLinkUrl,
            oneStableCoin,
            localAmount: exchangeAmount,
        };
        return sendSuccessResponse(res, 200, true, translate("Payment_link_created_successfully"), "createPaymentLink", finalPayload);
    } catch (error) {
        return next(error);
    }
}

export default createPaymentLink;
