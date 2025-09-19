import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import CashoutBeneficiary from "../../models/cashoutBeneficiary.js";
import { CashoutCategories } from "../../constants/index.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import setToCache from "../../utils/cache/setToCache.js";
import getFromCache from "../../utils/cache/getFromCache.js";

const GetCashoutBeneficiary = async (req, res, next) => {
    try {
        const { user: { _id }, query: { category, beneficiaryId } } = req;
        const { translate } = req;
        if (beneficiaryId) {
            if (!isValidMdbId(beneficiaryId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "beneFiciaryId" }), true);
            const cashoutDetails = await CashoutBeneficiary.findOne({ _id: beneficiaryId }).populate({ path: "bankDetailsId", select: "bankCode bankName category label" });
            if (!cashoutDetails) throw new ApiError("No Data", 400, translate("no_beneficiary_found"), true);
            return sendSuccessResponse(res, 200, true, translate("get_payees_success"), "getPayee", cashoutDetails);
        }
        let query = {
            userId: _id,
        };
        let key = `cashout-beneficiary:${_id}:`;
        if (category) {
            key = `cashout-beneficiary:${_id}:${category}`;
            if (!Object.values(CashoutCategories).includes(category.toUpperCase())) throw new ApiError("Invalid Details", 400, translate("invalid_category", { categories: Object.values(CashoutCategories) }), true);
            query = {
                userId: _id,
                category,
            };
        }
        const beneficiaries = await getFromCache(key);
        if (beneficiaries) return sendSuccessResponse(res, 200, true, translate("get_payees_success"), "getPayee", beneficiaries);
        const beneficiariesFromDb = await CashoutBeneficiary.find(query).sort({ createdAt: -1 }).populate({ path: "bankDetailsId", select: "bankCode bankName category label" });

        const finalPayload = {
            benificries: beneficiariesFromDb,
        };
        await setToCache(key, finalPayload);
        return sendSuccessResponse(res, 200, true, translate("get_payees_success"), "getPayee", finalPayload);
    } catch (error) {
        next(error);
    }
    return false;
};

export default GetCashoutBeneficiary;
