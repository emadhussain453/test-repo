import { Status } from "../../constants/index.js";
import CashinTransactionsV1 from "../../models/transactionsCashinsV1.js";

function getTime(minutes) {
    const now = new Date();
    return new Date(now.getTime() - minutes * 60 * 1000);
}
async function getUserCashinVolumeWithInTimeDuration(_id, time) {
    const lastTime = getTime(time || 30);
    const aggregationPipeline = [
        {
            $match: {
                userId: _id,
                status: { $in: [Status.COMPLETED] },
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
    const resulte = await CashinTransactionsV1.aggregate(aggregationPipeline);
    return resulte[0]?.totalAmount || 0;
}

export default getUserCashinVolumeWithInTimeDuration;
