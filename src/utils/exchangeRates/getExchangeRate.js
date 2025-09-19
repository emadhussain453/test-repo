import { ExpirySeconds } from "../../constants/index.js";
import StableExchangeRates from "../../models/exchangeRates.js";
import getFromCache from "../cache/getFromCache.js";
import setToCache from "../cache/setToCache.js";

const getExchangeRate = async (currency) => {
    try {
        const key = `exchangeRate:${currency}`;
        const exRates = await getFromCache(key);
        if (exRates) {
            return exRates;
        }

        // not found in cache then getit from db
        const dbExRates = await StableExchangeRates.findOne({ currency });
        if (!dbExRates) throw new Error("Exchange rate not found");
        await setToCache(key, dbExRates, ExpirySeconds.h1);

        return dbExRates;
    } catch (error) {
        throw new Error(error.message);
    }
};

export default getExchangeRate;
