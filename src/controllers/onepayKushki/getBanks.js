import { ExpirySeconds, FeatureNames } from "../../constants/index.js";
import Banks from "../../models/onepayKushkiBanksV2.js";
import { ApiError } from "../../utils/ApiError.js";
import getFromCache from "../../utils/cache/getFromCache.js";
import setToCache from "../../utils/cache/setToCache.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function getOnepayKushkiBanks(req, res, next) {
    try {
        const { user: { country: { countryCode } }, query: { search, feature = "cashin", type } } = req;

        const query = {
            countryCode,
            feature,
            isActive: true,
        };
        let key;
        if (type === "TRANSFIYA") {
            query.tag = { $in: ["both", "kushki"] };
            key = `onepay-kushki-Banks:TRANSFIYA:${countryCode}:${feature}`;
        } else {
            key = `onepay-kushki-Banks:${countryCode}:${feature}`;
        }

        if (search) {
            const regexPattern = new RegExp(search, "i");
            query.name = { $regex: regexPattern };
        } else {
            // lookup in cache
            const banksFromCache = await getFromCache(key);
            if (banksFromCache) return sendSuccessResponse(res, 200, true, "Bank found successfullys", "getBanks", banksFromCache);
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

export default getOnepayKushkiBanks;
