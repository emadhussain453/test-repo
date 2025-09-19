import { CashoutCategories, FeatureNames } from "../../constants/index.js";
import D24Banks from "../../models/d24Banks.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function searchBanks(req, res, next) {
    try {
        const { user: { country: { countryCode } }, query: { feature, category, search }, translate } = req;
        if (!Object.values([FeatureNames.cashin, FeatureNames.cashout]).includes(feature)) throw new ApiError("invalid details", 400, translate("invalid_feature", { features: ["CASHOUT", "CASHIN"] }), true);
        if (!Object.values(Object.values(CashoutCategories)).includes(category)) throw new ApiError("invalid details", 400, translate("invalid_category", { categories: Object.values(CashoutCategories) }), true);
        const query = {
            countryCode,
            feature,
            category,
            isActive: true,
        };
        if (search) {
            const regexPattern = new RegExp(search, "i");
            query.bankName = { $regex: regexPattern };
        }
        const banks = await D24Banks.find(query).sort({ bankName: 1 });

        return sendSuccessResponse(res, 200, true, "Bank found successfully", "getBanks", banks);
    } catch (error) {
        next(error);
    }
    return false;
}

export default searchBanks;
