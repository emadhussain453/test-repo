import logger from "../logger/index.js";
import AutoExchanges from "../models/autoExchange.js";

const calculateExchangeProfit = async (currencyId, amountPlusFee, exRate, amountDecType, feeAmount = 0) => {
    try {
        const autoExchange = await AutoExchanges.findOne({ currencyId });

        if (!autoExchange) logger.error("Automation for exchange rate not available");
        if (!autoExchange?.auto) logger.error(`Automation is off for ${currencyId}`);
        let amountToDeduct;
        if (autoExchange && autoExchange?.auto) {
            amountToDeduct = autoExchange[amountDecType] ?? 0;
        } else {
            amountToDeduct = 0;
        }
        const exRateProfit = (amountPlusFee * amountToDeduct) / exRate;
        const totalProfit = exRateProfit + feeAmount;

        return { exRateProfit, totalProfit, amountToDeduct };
    } catch (error) {
        logger.error("Error in calculating exchange profit:", error);
        throw new Error("Failed to calculate exchange profit.");
    }
};

export default calculateExchangeProfit;
