import { ExpirySeconds, FeatureNames } from "../../constants/index.js";
import Banks from "../../models/onepayKushkiBanksV2.js";
import { ApiError } from "../../utils/ApiError.js";
import getFromCache from "../../utils/cache/getFromCache.js";
import setToCache from "../../utils/cache/setToCache.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function getBanksV3(req, res, next) {
    try {
        const { user: { country: { countryCode } }, query: { search, feature = "cashin" } } = req;

        const query = {
            countryCode,
            feature,
            isActive: true,
        };
        if (feature && !Object.values([FeatureNames.cashin, FeatureNames.cashout]).includes(feature)) throw new ApiError("Feature is not valid", 400, "Please provide a valid feature.", true);

        const key = `onepay-kushki-Banks:${countryCode}:${feature}`;
        if (search) {
            const regexPattern = new RegExp(search, "i");
            query.name = { $regex: regexPattern };
        } else {
            // lookup in cache
            // const banksFromCache = await getFromCache(key);
            // if (banksFromCache) return sendSuccessResponse(res, 200, true, "Bank found successfullys", "getBanks", banksFromCache);
        }

        const banks = await Banks.find(query);
        const finalPayload = {
            banks,
        };
        if (!search) await setToCache(key, finalPayload, ExpirySeconds.m30);

        return sendSuccessResponse(res, 200, true, "Bank found successfully", "getBanks", finalPayload);
    } catch (error) {
        return next(error);
    }
}

export default getBanksV3;
