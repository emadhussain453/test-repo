import runWeeklyTransactionCheck from "../../jobs/completedTransactionScoreCredit.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const runCronJob = async (req, res, next) => {
    try {
        await runWeeklyTransactionCheck();
        return sendSuccessResponse(res, 200, true, "job start running successfully.", "cron-job");
    } catch (error) {
        next(error);
    }
    return false;
};

export default runCronJob;
