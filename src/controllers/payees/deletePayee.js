import Payees from "../../models/payees.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import isValidMdbId from "../../utils/isValidMdbId.js";

const deletePayee = async (req, res, next) => {
    try {
        const { user: { _id }, params: { payeeId } } = req;
        const { translate } = req;
        const query = { _id: payeeId, userId: _id };
        if (!isValidMdbId(payeeId)) throw new ApiError("payee error", 400, translate("payee_invalid_id"), true);
        const payeeDetails = await Payees.findOne(query).lean();
        if (!payeeDetails) {
            throw new ApiError("payee_error", 400, translate("payee_not_found"), true);
        }

        const payee = await Payees.deleteOne(query);
        if (!payee.deletedCount) {
            throw new ApiError("payee_error", 400, translate("payee_deletion_error"), true);
        }

        return sendSuccessResponse(res, 200, true, translate("payee_deleted_success"));
    } catch (error) {
        next(error);
    }
    return false;
};

export default deletePayee;
