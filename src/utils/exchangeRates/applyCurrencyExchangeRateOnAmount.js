import { ApiError } from "../ApiError.js";
import convertToRequiredDecimalPlaces from "../convertToRequiredDecimalPlaces.js";
import getExchgeRate from "./getExchangeRate.js";

const applyCurrencyExchangeRateOnAmount = async (amount, currency, type, convertToUsd = false, decimalPlaces = 2) => {
    try {
        // amount , currency=COP , selling,true
        const dbExchangeRateForCurrency = await getExchgeRate(currency);
        if (!dbExchangeRateForCurrency) throw new Error("Exchange rate not found");
        let rate = null;
        if (convertToUsd) { // for 2ns-option ==> when selling we have 2 opts 1-> given usd to check how my localCurr we get 2-> given cop converting to susd
            rate = amount / dbExchangeRateForCurrency[type];
        } else {
            rate = amount * dbExchangeRateForCurrency[type];
        }
        return convertToRequiredDecimalPlaces(rate, decimalPlaces);
    } catch (error) {
        throw new ApiError("Exchange Rate", 400, error.message, true);
    }
};

export default applyCurrencyExchangeRateOnAmount;
