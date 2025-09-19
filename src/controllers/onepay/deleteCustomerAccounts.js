import { User } from "@finix-payments/finix/lib/model/user.js";
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function customerAccountDelete(req, res, next) {
    try {
        const { translate } = req;
        const { account_id: accountId } = req.query;
        const Headers = {
            accept: "application/json",
            "content-type": "application/json",

        };
        if (!accountId) throw new ApiError("invalid details", 400, translate("accountId_required"), true);

        const params = `/${accountId}`;
        const result = await callApi.onepay("onepay", "deleteAcount", "delete", null, params, Headers);
        if (!result.success) throw new ApiError("Error in onePay Api", 400, translate("directa_api_error", { message: result.message }), true);
        return sendSuccessResponse(res, 200, true, translate("account_deleted_successfully"), "onepay");
    } catch (error) {
        next(error);
    }
    return false;
}
export default customerAccountDelete;
