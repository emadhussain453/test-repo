import { ApiError } from "../../../utils/ApiError.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import D24Banks from "../../../models/d24Banks.js";
import { CashoutCategories, FeatureNames, ExpirySeconds } from "../../../constants/index.js";
import setToCache from "../../../utils/cache/setToCache.js";
import getFromCache from "../../../utils/cache/getFromCache.js";

async function getBanks(req, res, next) {
    try {
        const { user: { country: { countryCode } }, query: { category, feature = "cashin", isActive = "true" } } = req;

        const query = {
            countryCode,
        };
        let keyValue = `${countryCode}`;
        if (category && !Object.values(Object.values(CashoutCategories)).includes(category)) throw new ApiError("Category is not valid", 400, "Error while getting Banks", true);
        if (feature && !Object.values([FeatureNames.cashin, FeatureNames.cashout]).includes(feature)) throw new ApiError("Feature is not valid", 400, "Error while getting Banks", true);
        if (isActive && !Object.values(["true", "false"]).includes(isActive)) throw new ApiError("isActive is not valid", 400, "Error while getting Banks", true);

        if (feature) { query.feature = feature; keyValue += `:${feature}`; }
        if (isActive) { query.isActive = JSON.parse(isActive); keyValue += `:${JSON.parse(isActive)}`; }
        if (category) { query.category = category; keyValue += `:${category.toLowerCase()}`; }

        const key = `d24Banks${keyValue}`;

        const banksFromCache = await getFromCache(key);
        const finalPayloadFromCache = {
            banks: banksFromCache,
        };
        if (banksFromCache) return sendSuccessResponse(res, 200, true, "Bank found successfullys", "getBanks", finalPayloadFromCache);

        const banks = await D24Banks.find(query).sort({ bankName: 1 });
        const finalPayload = {
            banks,
        };

        if (finalPayload.banks.length) await setToCache(key, finalPayload.banks, ExpirySeconds.m30);

        return sendSuccessResponse(res, 200, true, "Bank found successfully", "getBanks", finalPayload);
    } catch (error) {
        next(error);
    }
    return false;
}

export default getBanks;
