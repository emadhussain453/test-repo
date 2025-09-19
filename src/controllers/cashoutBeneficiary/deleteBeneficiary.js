import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import CashoutBeneficiary from "../../models/cashoutBeneficiary.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import deleteFromCache from "../../utils/cache/deleteFromCache.js";

const DeleteCashoutBeneficiary = async (req, res, next) => {
    try {
        const { user: { _id }, query: { beneficiaryId } } = req;
        const { translate } = req;
        if (!isValidMdbId(beneficiaryId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "beneFiciaryId" }), true);
        const cashoutDetails = await CashoutBeneficiary.findOne({ _id: beneficiaryId, userId: _id });
        if (!cashoutDetails) throw new ApiError("No Data", 400, translate("no_beneficiary_found"), true);
        const deletebeneficiary = await CashoutBeneficiary.deleteOne({ _id: beneficiaryId });
        if (deletebeneficiary.deletedCount < 1) throw new ApiError("No Data", 400, translate("payee_deletion_error"), true);
        const key = `cashout-beneficiary:${_id}:${cashoutDetails.category}`;
        const allDatakey = `cashout-beneficiary:${_id}:`;
        await deleteFromCache([key, allDatakey]);
        return sendSuccessResponse(res, 200, true, translate("payee_deleted_success"), "deletePayee");
    } catch (error) {
        next(error);
    }
    return false;
};

export default DeleteCashoutBeneficiary;
