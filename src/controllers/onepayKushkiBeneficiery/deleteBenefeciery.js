import OnepayKushkBenefeciery from "../../models/onepayKushkiCashoutBenefeciary.js";
import { ApiError } from "../../utils/ApiError.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const deleteBeneficiary = async (req, res, next) => {
    try {
        const { user: { _id }, query: { beneficiaryId } } = req;
        const { translate } = req;
        if (!isValidMdbId(beneficiaryId)) throw new ApiError("Invalid details", 400, translate("invalid_md_id", { name: "beneficiaryId" }), true);
        const beneficiary = await OnepayKushkBenefeciery.findOne({ _id: beneficiaryId, userId: _id, isDeleted: false });
        if (!beneficiary) throw new ApiError("Invalid details", 400, translate("beneficiary_not_exist"), true);
        await OnepayKushkBenefeciery.updateOne({ _id: beneficiaryId }, { isDeleted: true });
        return sendSuccessResponse(res, 200, true, translate("payee_deleted_success"), "getPayees");
    } catch (error) {
        next(error);
    }
    return false;
};

export default deleteBeneficiary;
