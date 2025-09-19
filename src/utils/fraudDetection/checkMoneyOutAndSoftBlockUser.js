import { EventTypes, ScoreKeys } from "../../constants/index.js";
import Event from "../../Events/databaseLogs.js";
import logger from "../../logger/index.js";
import ScoreHistory from "../../models/scoreHistory.js";
import fraudDetectionBlock from "./fraudDetectionUserBlock.js";
import getUserCashinVolumeWithInTimeDuration from "./getCashinVolumWithInTimeDuration.js";
import getUserCashoutVolumeWithInTimeDuration from "./getCashoutWithInTimeDuration.js";

function getTimeAfterMinusMinutes(minutes) {
    const now = new Date();
    return new Date(now.getTime() - minutes * 60 * 1000);
}
const checkMoneyOutAndSoftBlockUser = async (userId, amount, timeToCheck = 120, percentageThreshold = 80, cashinVolumeToCheck = 1000, type = "p2p") => {
    try {
        let userBlock = false;
        const time = getTimeAfterMinusMinutes(timeToCheck);
        const checkIfAlreadyApplyFlag = await ScoreHistory.findOne({ userId, code: ScoreKeys.CASHIN_OUT_SAME, createdAt: { $gte: time } });
        if (!checkIfAlreadyApplyFlag) {
            const lastCashinVolume = await getUserCashinVolumeWithInTimeDuration(userId, timeToCheck);
            if (lastCashinVolume >= cashinVolumeToCheck) {
                const maxAllowedCashout = lastCashinVolume * (percentageThreshold / 100);
                // const tryingPercentage = convertToRequiredDecimalPlaces(100 * (amount / lastCashinVolume), 2);
                let checkIfAnyP2pOrCashout = 0;
                if (amount <= maxAllowedCashout) checkIfAnyP2pOrCashout = await getUserCashoutVolumeWithInTimeDuration(userId, timeToCheck);
                if ((amount + checkIfAnyP2pOrCashout) >= maxAllowedCashout) {
                    await fraudDetectionBlock(userId, `User has reached the threshold by attempting a p2p/cash-out transaction relative to their recent cash-in activity`);
                    logger.info(`User soft-block due to ${type} money out.`);
                    // user score updated
                    const scoreData = {
                        userId,
                        code: ScoreKeys.CASHIN_OUT_SAME,
                    };
                    Event.emit(EventTypes.UpdateUserScore, scoreData);
                    userBlock = true;
                }
            }
        }
        return userBlock;
    } catch (error) {
        throw new Error(error);
    }
};

export default checkMoneyOutAndSoftBlockUser;
