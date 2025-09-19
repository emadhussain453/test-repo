import cron from "node-cron";
import GetD24ExchangeRate from "../utils/exchangeRates/getD24ExchangeRate.js";
import StableExchangeRates from "../models/exchangeRates.js";
import { CountryCurrencies, ExpirySeconds } from "../constants/index.js";
import logger from "../logger/index.js";
import DirectaFxRate from "../models/directaFxRate.js";
import AutoExchanges from "../models/autoExchange.js";
import setToCache from "../utils/cache/setToCache.js";

async function cronJob() {
    try {
        logger.info("Cron Job :: Saving Exchange rate");
        const countryCode = "COL";
        const amount = 1;
        const currency = CountryCurrencies[countryCode];
        const arrayOfPromises = [
            StableExchangeRates.findOne({ currency }),
            GetD24ExchangeRate(countryCode, amount),
        ];
        const [stableExRate, d24ExRate] = await Promise.all(arrayOfPromises);
        if (!d24ExRate.fx_rate) throw new Error("Directa24 Exchange rate not available.");

        const autoExchange = await AutoExchanges.findOne({ currencyId: stableExRate._id });
        if (!autoExchange) logger.error("Automation for exchange rate not available");
        if (!autoExchange.auto) logger.error(`Automation is off for ${currency}`);

        if (autoExchange && autoExchange?.auto) {
            // get amount to add into buying and selling
            const amountToAdd = autoExchange.amountIncToBuying ?? 0;
            const amountToDeduct = autoExchange.amountDecToSelling ?? 0;

            const updatedValuesForBuying = d24ExRate.fx_rate + amountToAdd;
            const updatedValuesForSelling = d24ExRate.fx_rate - amountToDeduct;
            logger.info("Exchange value before update");
            logger.info({
                D24FxRate: d24ExRate.fx_rate,
                beforeUpdate: {
                    buying: stableExRate.buying,
                    selling: stableExRate.selling,
                },
                afterUpdate: {
                    buying: updatedValuesForBuying,
                    selling: updatedValuesForSelling,
                },
            });
            const updateExchageRate = await StableExchangeRates.findOneAndUpdate({ _id: stableExRate._id }, { $set: { buying: updatedValuesForBuying, selling: updatedValuesForSelling } });
            const key = `exchangeRate:${updateExchageRate.currency}`;
            await setToCache(key, updateExchageRate, ExpirySeconds.h1);
        }

        const Directa24FxRate = new DirectaFxRate({
            countryCode,
            currency,
            fxRate: d24ExRate.fx_rate,
        });
        await Directa24FxRate.save();
        logger.info(`Cron Job :: Exchange rate saved successfully :: ${d24ExRate.fx_rate}`);
    } catch (error) {
        logger.error(`Cron Job :: ${error.message}`);
    }
}
const UpdateExchageRate = cron.schedule("0 * * * *", cronJob);

export default UpdateExchageRate;
