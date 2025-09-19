import { Status } from "../constants/index.js";
import CashinTransactionsV1 from "../models/transactionsCashinsV1.js";

function getDate(days) {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() - days);
    return now;
}
async function getUserCashinVolume(_id, checkDays) {
    const lastDate = getDate(checkDays);
    if (checkDays === 0) {
        lastDate.setUTCHours(0, 0, 0, 0);
    }
    const aggregationPipeline = [
        {
            $match: {
                userId: _id,
                status: { $in: [Status.COMPLETED] },
                createdAt: { $gte: lastDate },
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: { $toDouble: "$amount" } },
            },
        },
    ];

    const resulte = await CashinTransactionsV1.aggregate(aggregationPipeline);
    return resulte[0]?.totalAmount || 0;
}

export default getUserCashinVolume;
