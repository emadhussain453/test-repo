import moment from "moment";
import cron from "node-cron";
import logger from "../logger/index.js";
import SystemLogs from "../models/systemLogs.js";
import DirectaFxRate from "../models/directaFxRate.js";

async function cronJob() {
    try {
        const twoMonthsAgo = moment().subtract(2, "months").toDate();
        const twoWeeksAgo = moment().subtract(2, "weeks").toDate();

        const twoWeeksOlderLogs = await SystemLogs.deleteMany({ createdAt: { $lt: twoWeeksAgo } });
        const twoMonthsOlderExchangeRates = await DirectaFxRate.deleteMany({ createdAt: { $lt: twoMonthsAgo } });

        const finalObject = {
            deleteLogs: twoWeeksOlderLogs,
            deleteExchangeRates: twoMonthsOlderExchangeRates,
        };
    } catch (error) {
        logger.error(`Cron Job :: ${error.message}`);
    }
}
const deleteOldLogs = cron.schedule("0 0 * * *", cronJob);

export default deleteOldLogs;
