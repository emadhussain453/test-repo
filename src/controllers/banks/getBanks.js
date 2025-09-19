import { ExpirySeconds, FeatureNames } from "../../constants/index.js";
import D24Banks from "../../models/d24Banks.js";
import { ApiError } from "../../utils/ApiError.js";
import getFromCache from "../../utils/cache/getFromCache.js";
import setToCache from "../../utils/cache/setToCache.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function getBanksV2(req, res, next) {
    try {
        const { user: { country: { countryCode } }, query: { feature = "cashin" } } = req;

        const query = {
            countryCode,
            feature,
            isActive: true,
        };
        if (feature && !Object.values([FeatureNames.cashin, FeatureNames.cashout]).includes(feature)) throw new ApiError("Feature is not valid", 400, "Error while getting Banks", true);

        const key = `d24Banks:${countryCode}:${feature}`;

        // lookup in cache
        const banksFromCache = await getFromCache(key);
        if (banksFromCache) return sendSuccessResponse(res, 200, true, "Bank found successfullys", "getBanks", banksFromCache);

        // get from db
        const aggregation = [
            {
                $facet: {
                    static: [
                        {
                            $match: {
                                ...query, type: { $exists: true },
                            },
                        },
                        {
                            $sort: {
                                bankName: 1,
                            },
                        },
                        {
                            $group: {
                                _id: "$type",
                                banks: {
                                    $push: "$$ROOT",
                                },
                            },
                        },
                    ],
                    categories: [
                        {
                            $match: {
                                ...query,
                                category: { $ne: null },
                            },
                        },
                        {
                            $sort: {
                                bankName: 1,
                            },
                        },
                        {
                            $group: {
                                _id: {
                                    $concat: [
                                        { $toUpper: { $substr: ["$category", 0, 1] } },
                                        { $toLower: { $substr: ["$category", 1, { $strLenCP: "$category" }] } },
                                    ],
                                },
                                banks: {
                                    $push: "$$ROOT",
                                },
                            },
                        },
                    ],
                },
            },
        ];
        const banks = await D24Banks.aggregate(aggregation);

        const { static: staticBanks, categories } = banks[0];

        const finalPayload = {
            staticBanks,
            categories,
        };
        await setToCache(key, finalPayload, ExpirySeconds.m30);

        return sendSuccessResponse(res, 200, true, "Bank found successfully", "getBanks", finalPayload);
    } catch (error) {
        return next(error);
    }
}

export default getBanksV2;
