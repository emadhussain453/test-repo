import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import ENV from "../../../config/keys.js";
import headerForCashOut from "../../../utils/directa24/headerForCashOut.js";
import callApi from "../../../utils/callApi.js";
import { ApiError } from "../../../utils/ApiError.js";
import TransactionsCashOut from "../../../models/directaCashout.js";

async function cashoutStatus(req, res, next) {
    try {
        const { _id, email } = req.user;
        const { cashoutId } = req.body;
        const { translate } = req;
        const apiBody = {
            login: ENV.DIRECTA_24.API_KEY,
            pass: ENV.DIRECTA_24.API_PASS,
            cashout_id: cashoutId,
        };
        const authHeaders = headerForCashOut(apiBody);
        const result = await callApi.callDirecta24Api("directa24CashOut", "cashOutStatus", "POST", apiBody, false, authHeaders);
        if (!result.success) throw new ApiError("Error in directa Api", 400, translate("directa_api_error", { message: result.message }), true);

        const newvalue = result.results.cashout_status_description;
        const newStatus = { $set: { status: newvalue } };
        await TransactionsCashOut.updateOne({ cashoutId }, { newStatus });

        return sendSuccessResponse(res, 200, true, translate("cashout_successfully"), result.results, false);
    } catch (error) {
        next(error);
    }
    return false;
}
export default cashoutStatus;
