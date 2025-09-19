import { ExpirySeconds } from "../constants/index.js";
import ScoreRule from "../models/scoreRules.js";
import getFromCache from "./cache/getFromCache.js";
import setToCache from "./cache/setToCache.js";

const getScoreRule = async () => {
    try {
        let scoreRule = await getFromCache("score-rules");
        if (!scoreRule) {
            scoreRule = await ScoreRule.findOne({});
            if (!scoreRule) return false;
            setToCache("score-rules", scoreRule, ExpirySeconds.d1);
        }
        return scoreRule;
    } catch (error) {
        throw new Error(error);
    }
};

export default getScoreRule;
