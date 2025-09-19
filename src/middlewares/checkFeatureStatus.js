import redisClient from "../config/redis.js";
import { CountryCodes, CountryCodesOnly, ExpirySeconds, FeatureNames, InternationalCountryCodes } from "../constants/index.js";
import logger from "../logger/index.js";
import FeatureStatus from "../models/featureStatus.js";
import { ApiError } from "../utils/ApiError.js";
import getFromCache from "../utils/cache/getFromCache.js";
import setToCache from "../utils/cache/setToCache.js";
import capitalizeName from "../utils/capitalizeName.js";

async function getFeatureStatus(featureName) {
    let isFeatureLive = true;
    try {
        const key = `Feature-${featureName}`;
        const isExists = await getFromCache(key);
        if (!isExists) {
            const featureStatus = await FeatureStatus.findOne({ featureName });
            if (!featureStatus) {
                logger.warn("No cashout feature found.");
                isFeatureLive = true;
                return isFeatureLive;
            }
            isFeatureLive = featureStatus.status;
            // set to cache
            await setToCache(key, featureStatus);
            return isFeatureLive;
        }
        isFeatureLive = isExists.status;
        return isFeatureLive;
    } catch (error) {
        return isFeatureLive;
    }
}

const checkFeatureStatus = (feature) => {
    const Handler = async (req, res, next) => {
        const { user: { country: { countryCode } }, translate } = req;
        // get bearer token from header
        try {
            if (process.env.NODE_ENV === "production" && feature === FeatureNames.card && countryCode === InternationalCountryCodes.MEX) throw new ApiError("Invalid request", 400, translate("feature_under_development", { feature: capitalizeName(feature) }), true);
            const isFeatureLive = await getFeatureStatus(feature);
            if (!isFeatureLive) throw new ApiError("Invalid request", 400, translate("feature_under_development", { feature: capitalizeName(feature) }), true);

            next();
        } catch (error) {
            next(error);
        }
    };
    return Handler;
};

export default checkFeatureStatus;
