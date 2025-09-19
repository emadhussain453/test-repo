import logger from "../logger/index.js";
import ApiMethod from "../models/apiMethod.js";
import { ApiError } from "../utils/ApiError.js";
import getFromCache from "../utils/cache/getFromCache.js";
import setToCache from "../utils/cache/setToCache.js";

async function getApiMethodStatus(methodName) {
    let isApiMethodActive = true;
    try {
        const key = `apiMethod-${methodName}`;
        const isExists = await getFromCache(key);
        if (!isExists) {
            const apiMethodStatus = await ApiMethod.findOne({ methodName }).select("methodName isActive").lean();
            if (!apiMethodStatus) {
                logger.warn("No apiMethod found.");
                isApiMethodActive = true;
                return isApiMethodActive;
            }
            isApiMethodActive = apiMethodStatus.isActive;
            // set to cache
            const payLoad = {
                methodName: apiMethodStatus.methodName,
                isActive: apiMethodStatus.isActive,
            };
            await setToCache(key, payLoad);
            return isApiMethodActive;
        }
        isApiMethodActive = isExists.isActive;
        return isApiMethodActive;
    } catch (error) {
        return isApiMethodActive;
    }
}

const checkApiMethodStatus = async (req, res, next) => {
    try {
        const { t: translate } = req;
        const method = req.method.toUpperCase();
        const isApiMethodActive = await getApiMethodStatus(method);
        if (!isApiMethodActive) throw new ApiError("Invalid request", 400, translate(`${method.toLowerCase()}_under_development`, { method }), true);

        next();
    } catch (error) {
        next(error);
    }
    return checkApiMethodStatus;
};
export default checkApiMethodStatus;
