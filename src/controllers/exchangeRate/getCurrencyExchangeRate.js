import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { CountryCurrencies, DirectaCardPaymentMethods, DirectaPaymentMethods, ExTypes, StableCurrencies } from "../../constants/index.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import getFeeAndFeeObject from "../../utils/exchangeRates/getFeeAndObject.js";
import applyCurrencyExchangeRateOnAmount from "../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import getFeeObjectForCashin from "../../utils/exchangeRates/calculateFeeForDirectaCashin.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";

const getCurrencyExchangeRate = async (req, res, next) => {
    try {
        const { translate } = req;
        const { query: { type = "cashin", amount, paymentMethod, countryCode, service = "DIRECTA24", SUSD = false, stableExchange = false } } = req;

        const convertedAmount = Number(amount);
        const isSUSD = SUSD === "true" && true;
        const isStableExchange = stableExchange === "true" && true;

        if (!countryCode) throw new ApiError("Exchange rate error", 400, translate("country_code_required"), true);

        const currency = CountryCurrencies[countryCode];
        if (!currency) throw new ApiError("Exchange rate error", 400, translate("exchange_rate_unavailable"), true);
        const cardPaymentMethods = DirectaCardPaymentMethods[countryCode];
        const isCardPayment = cardPaymentMethods?.includes(DirectaPaymentMethods[countryCode][paymentMethod]);
        // get stable exchange rates for specific currency
        if (!paymentMethod && isStableExchange) {
            const exRates = await getExchangeRate(currency);
            if (!exRates) throw new ApiError("Exchange rate error", 400, translate("exchange_rate_unavailable"), true);
            return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", exRates);
        }

        if (type === "cashout") {
            if (!isSUSD) { // incomming SUSD -> returning COP
                const userAmount = convertToRequiredDecimalPlaces(amount, 4);
                const feeObject = await getFeeAndFeeObject(userAmount, service, "CASHOUT", countryCode);
                const finalAmountAfterFeeInSUSD = Number(userAmount) - Number(feeObject.amount);
                const totalLocalCurrency = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, false, 4);
                const oneStableCoin = calculateOneStableCoin(totalLocalCurrency, userAmount);
                const finalResponse = {
                    amount: convertedAmount,
                    totalLocalCurrency,
                    oneStableCoin,
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }
            if (isSUSD) { // incomming COP -> returning susd
                const userAmount = convertToRequiredDecimalPlaces(amount, 4);
                const amountInSusd = await applyCurrencyExchangeRateOnAmount(userAmount, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, true, 4);
                const feeObject = await getFeeAndFeeObject(amountInSusd, service, "CASHOUT", countryCode);
                const totalSusd = Number(amountInSusd) + Number(feeObject.amount);
                const oneStableCoin = calculateOneStableCoin(userAmount, totalSusd);
                const finalResponse = {
                    amount: convertedAmount,
                    totalSusd: convertToRequiredDecimalPlaces(totalSusd),
                    oneStableCoin,
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }
        }
        if (type === "onepay-cashout") {
            if (!isSUSD) { // incomming SUSD -> returning COP
                const userAmount = convertToRequiredDecimalPlaces(amount, 4);

                const feeObject = await getFeeAndFeeObject(userAmount, "ONEPAY", "CASHOUT", countryCode);
                const finalAmountAfterFeeInSUSD = Number(userAmount) - Number(feeObject.amount);
                const totalLocalCurrency = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, false, 4);
                const oneStableCoin = calculateOneStableCoin(totalLocalCurrency, userAmount);
                const finalResponse = {
                    amount: convertedAmount,
                    totalLocalCurrency,
                    oneStableCoin,
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }

            if (isSUSD) { // incomming COP -> returning susd
                const userAmount = convertToRequiredDecimalPlaces(amount, 4);
                const amountInSusd = await applyCurrencyExchangeRateOnAmount(userAmount, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, true, 4);
                const feeObject = await getFeeAndFeeObject(amountInSusd, "ONEPAY", "CASHOUT", countryCode);
                const totalSusd = Number(amountInSusd) + Number(feeObject.amount);
                const oneStableCoin = calculateOneStableCoin(userAmount, totalSusd);
                const finalResponse = {
                    amount: convertedAmount,
                    totalSusd: convertToRequiredDecimalPlaces(totalSusd),
                    oneStableCoin,
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }
        }
        if (type === "onepay-cashin") {
            if (!isSUSD) { // incomming SUSD -> returning COP
                const userAmount = convertToRequiredDecimalPlaces(amount, 4);

                const feeObject = await getFeeAndFeeObject(userAmount, "ONEPAY", "CASHIN", countryCode);
                const finalAmountAfterFeeInSUSD = Number(userAmount) + Number(feeObject.amount);
                const totalLocalCurrency = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Buying, false, 4);
                const oneStableCoin = calculateOneStableCoin(totalLocalCurrency, userAmount);
                const finalResponse = {
                    amount: convertedAmount,
                    totalLocalCurrency,
                    oneStableCoin,
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }

            if (isSUSD) { // incomming COP -> returning susd
                const userAmount = convertToRequiredDecimalPlaces(amount, 4);
                const { buying: stableBuyingExRate } = await getExchangeRate(currency);
                const totalSUSDWithoutFee = convertToRequiredDecimalPlaces((userAmount / stableBuyingExRate));
                const feeObject = await getFeeAndFeeObject(totalSUSDWithoutFee, "ONEPAY", "CASHIN", countryCode);
                const { amount: totalFee } = feeObject;
                const totalSusd = Number(totalSUSDWithoutFee) - (totalFee);
                const oneStableCoin = calculateOneStableCoin(userAmount, totalSusd);
                const finalResponse = {
                    amount: convertedAmount,
                    totalSusd,
                    oneStableCoin,
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }
        }

        if (type === "cashin") {
            if (!isSUSD) { // returns cop --> input susd
                const paymentService = "DIRECTA24";
                const serviceFeture = "CASHIN";
                const { amount: feeAmount } = await getFeeObjectForCashin(convertedAmount, paymentService, serviceFeture, countryCode, isCardPayment);
                const totalAmount = convertedAmount + feeAmount;
                const exRates = await getExchangeRate(currency);
                const totalLocalCurrency = convertToRequiredDecimalPlaces(totalAmount * exRates.buying);
                const finalResponse = {
                    amount: convertedAmount,
                    totalLocalCurrency,
                    oneStableCoin: calculateOneStableCoin(totalLocalCurrency, convertedAmount),
                };
                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalResponse);
            }

            if (isSUSD) { // returns SUSD --> input cop
                const paymentService = "DIRECTA24";
                const serviceFeature = "CASHIN";
                const stableExRate = await getExchangeRate(currency);

                const stableBuyingExchangeRateForCurrency = stableExRate.buying;
                const totalSUSDWithoutFee = convertToRequiredDecimalPlaces((convertedAmount / stableBuyingExchangeRateForCurrency));
                const { amount: totalFeeAmount } = await getFeeObjectForCashin(totalSUSDWithoutFee, paymentService, serviceFeature, countryCode, isCardPayment);
                const totalSUSDs = (totalSUSDWithoutFee - (totalFeeAmount));
                const totalSUSDFixed = convertToRequiredDecimalPlaces(totalSUSDs);
                const oneStableCoin = convertToRequiredDecimalPlaces(convertedAmount / totalSUSDFixed);
                const finalPayload = {
                    amount: convertedAmount,
                    totalSusd: totalSUSDFixed,
                    oneStableCoin,
                };

                return sendSuccessResponse(res, 200, true, translate("exchange_rate_success"), "exchangeRateForCurrency", finalPayload);
            }
        }

        throw new ApiError("invalid_request", 400, translate("something_went_wrong"), true);
    } catch (error) {
        next(error);
    }
    return false;
};

export default getCurrencyExchangeRate;
