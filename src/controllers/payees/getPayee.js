import Payees from "../../models/payees.js";
import { ApiError } from "../../utils/ApiError.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const getPayee = async (req, res, next) => {
    try {
        const { user: { _id }, params: { payeeId } } = req;
        const query = { userId: _id, _id: payeeId };
        const { translate } = req;
        if (!isValidMdbId(payeeId)) throw new ApiError("payee error", 400, translate("payee_invalid_id"), true);
        const payee = await Payees.findOne(query)
            .populate("payeeUserId", "avatar email phoneNumber firstName lastName")
            .lean();
        if (!payee) {
            throw new ApiError("payee error", 400, translate("payee_not_found"), true);
        }
        const finalPayload = {
            ...payee,
            phoneNumber: payee.payeeUserId?.phoneNumber || payee.phoneNumber,
            firstName: payee.payeeUserId?.firstName || payee.firstName,
            lastName: payee.payeeUserId?.lastName || payee.lastName,
        };
        return sendSuccessResponse(res, 200, true, translate("get_payees_success"), "getPayees", finalPayload);
    } catch (error) {
        next(error);
    }
    return false;
};

export default getPayee;
