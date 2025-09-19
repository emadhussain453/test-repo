import { StableModelsNames, Status } from "../../constants/index.js";
import Transactions from "../../models/transactions.js";

function getTime(minutes) {
    const now = new Date();
    return new Date(now.getTime() - minutes * 60 * 1000);
}
async function getUserCashoutVolumeWithInTimeDuration(_id, time) {
    const lastTime = getTime(time || 30);
    const aggregationPipeline = [
        {
            $match: {
                $or: [{ userId: _id }, { from: _id }],
                transactionModel: { $in: [StableModelsNames.CASHOUT, StableModelsNames.P2P] },
                status: { $in: [Status.COMPLETED, Status.PENDING] },
                createdAt: { $gte: lastTime },
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: { $toDouble: "$amount" } },
            },
        },
    ];
    const resulte = await Transactions.aggregate(aggregationPipeline);
    return resulte[0]?.totalAmount || 0;
}

export default getUserCashoutVolumeWithInTimeDuration;
