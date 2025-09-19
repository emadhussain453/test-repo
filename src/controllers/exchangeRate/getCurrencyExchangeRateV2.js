/* eslint-disable no-nested-ternary */
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import { CountryCurrencies, ExTypes, StableCurrencies } from "../../constants/index.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import getFeeAndFeeObjectV1 from "../../utils/exchangeRates/getFeeAndObjectV1.js";
import applyCurrencyExchangeRateOnAmount from "../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import getAppConfig from "../../utils/getAppConfig.js";

const getCurrencyExchangeRateV1 = async (req, res, next) => {
    try {
        const { translate } = req;
        const { query: { tag, type: inputType = "cashin", amount = 1, paymentMethod, countryCode, service: requestedService = "ONEPAY", SUSD = false, stableExchange = false } } = req;
        if (!amount) throw new ApiError("Validation error", 400, translate("Amount_required"));
        const convertedAmount = Number(amount);
        const isSUSD = SUSD === "true" && true;
        const isStableExchange = stableExchange === "true" && true;

        const typeMapping = {
            "onepay-cashin": "cashin",
            "onepay-cashout": "cashout",
        };
        const type = typeMapping[inputType] || inputType;
        let service = requestedService;
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        if (!countryCode) throw new ApiError("Exchange rate error", 400, translate("country_code_required"), true);
        if (!["cashin", "cashout"].includes(type?.toLowerCase())) throw new ApiError("Exchange rate error", 400, translate("invalid_type"), true);

        const currency = CountryCurrencies[countryCode];
        if (!currency) throw new ApiError("Exchange rate error", 400, translate("exchange_rate_unavailable"), true);
        // get stable exchange rates for specific currency
        if (!paymentMethod && isStableExchange) {
            const exRates = await getExchangeRate(currency);
            if (!exRates) throw new ApiError("Exchange rate error", 400, translate("exchange_rate_unavailable"), true);
            return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", exRates);
        }

        if (type === "cashout") {
            const { cashout: { serviceThreshold } } = app;
            if (!isSUSD) { // incomming SUSD -> returning COP
                if (tag) service = tag === "both" ? (Number(amount) > serviceThreshold ? "ONEPAY" : "KUSHKI") : tag.toUpperCase();
                const userAmount = convertToRequiredDecimalPlaces(amount, 4);

                const feeObject = await getFeeAndFeeObjectV1(userAmount, service, "CASHOUT", countryCode);
                const { amount: feeAmount } = feeObject;
                const finalAmountAfterFeeInSUSD = Number(userAmount) - Number(feeAmount);
                const totalLocalCurrency = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, false, 4);
                const oneStableCoin = calculateOneStableCoin(totalLocalCurrency, userAmount);
                const finalResponse = {
                    amount: convertedAmount,
                    totalLocalCurrency,
                    oneStableCoin,
                    service,
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }

            if (isSUSD) { // incomming COP -> returning susd
                const userAmount = convertToRequiredDecimalPlaces(amount, 4);
                const amountInSusd = await applyCurrencyExchangeRateOnAmount(userAmount, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, true, 4);
                if (tag) service = tag === "both" ? (Number(amountInSusd) > serviceThreshold ? "ONEPAY" : "KUSHKI") : tag.toUpperCase();
                const feeObject = await getFeeAndFeeObjectV1(amountInSusd, service, "CASHOUT", countryCode);
                const { amount: feeAmount } = feeObject;
                const totalSusd = Number(amountInSusd) + Number(feeAmount);
                const oneStableCoin = calculateOneStableCoin(userAmount, totalSusd);
                const finalResponse = {
                    amount: convertedAmount,
                    totalSusd: convertToRequiredDecimalPlaces(totalSusd),
                    oneStableCoin,
                    service,
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }
        }
        if (type === "cashin") {
            const { cashin: { serviceThreshold } } = app;
            if (!isSUSD) { // incomming SUSD -> returning COP
                if (tag) service = tag === "both" ? (Number(amount) > serviceThreshold ? "ONEPAY" : "KUSHKI") : tag.toUpperCase();
                const userAmount = convertToRequiredDecimalPlaces(amount, 4);

                const feeObject = await getFeeAndFeeObjectV1(userAmount, service, "CASHIN", countryCode);
                const { amount: feeAmount } = feeObject;
                const finalAmountAfterFeeInSUSD = Number(userAmount) + Number(feeAmount);
                const totalLocalCurrency = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Buying, false, 4);
                const oneStableCoin = calculateOneStableCoin(totalLocalCurrency, userAmount);
                const finalResponse = {
                    amount: convertedAmount,
                    totalLocalCurrency,
                    oneStableCoin,
                    service,
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }

            if (isSUSD) { // incomming COP -> returning susd
                const userAmount = convertToRequiredDecimalPlaces(amount, 4);
                const { buying: stableBuyingExRate } = await getExchangeRate(currency);
                const totalSUSDWithoutFee = convertToRequiredDecimalPlaces((userAmount / stableBuyingExRate));
                if (tag) service = tag === "both" ? (Number(totalSUSDWithoutFee) > serviceThreshold ? "ONEPAY" : "KUSHKI") : tag.toUpperCase();
                const feeObject = await getFeeAndFeeObjectV1(totalSUSDWithoutFee, service, "CASHIN", countryCode);
                const { amount: feeAmount } = feeObject;
                const totalSusd = Number(totalSUSDWithoutFee) - (feeAmount);
                const oneStableCoin = calculateOneStableCoin(userAmount, totalSusd);
                const finalResponse = {
                    amount: convertedAmount,
                    totalSusd,
                    oneStableCoin,
                    service,
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }
        }

        throw new ApiError("invalid_request", 400, translate("something_went_wrong"), true);
    } catch (error) {
        next(error);
    }
    return false;
};

export default getCurrencyExchangeRateV1;
