import { StableModelsNames, Status } from "../constants/index.js";
import Transactions from "../models/transactions.js";

function getTimeAfterMinueHours(hours) {
    const now = new Date();
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
}
const checkCashinFailedTransactions = async (userId, time, transactionRefrenceId) => {
    try {
        const lastTime = getTimeAfterMinueHours(time || 30);
        const query = {
            userId,
            transactionRefrenceId: { $ne: transactionRefrenceId },
            transactionModel: StableModelsNames.CASHIN_V1,
            status: { $in: [Status.DECLINED, Status.FAILED, Status.EXPIRED, Status.REJECTED] },
            createdAt: { $gte: lastTime },
        };
        const transactions = await Transactions.countDocuments(query);
        return transactions || 0;
    } catch (error) {
        throw new Error(error);
    }
};

export default checkCashinFailedTransactions;
