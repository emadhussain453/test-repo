import logger from "../logger/index.js";
import ScoreHistory from "../models/scoreHistory.js";
import Users from "../models/users.js";
import getScoreRule from "./getScoreRules.js";

async function updateUserScore(userId, code) {
    try {
        const config = await getScoreRule();
        const score = config?.[code];
        if (typeof score !== "number" || score === 0) return;
        // Update score
        await Promise.all([
            Users.updateOne({ _id: userId }, { $inc: { score } }),
            ScoreHistory.create({ userId, code, score }),
        ]);
    } catch (err) {
        logger.error(`error in update score of user`);
    }
}

export default updateUserScore;
