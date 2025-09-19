import { User } from "@finix-payments/finix/lib/model/user.js";
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function customerAccounts(req, res, next) {
    try {
        const { translate, query: { page = 1, limit = 20 } } = req;
        const { onepayCustomerId } = req.user;
        const Headers = {
            accept: "application/json",
            "content-type": "application/json",
        };
        if (!onepayCustomerId) throw new ApiError("invalid details", 400, translate("customerId_not_found"), true);
        const params = `/${onepayCustomerId}/accounts?page=${page}`;
        const result = await callApi.onepay("onepay", "customerAccounts", "get", null, params, Headers);
        if (!result.success) throw new ApiError("Error in onePay Api", 400, translate("directa_api_error", { message: result.message }), true);
        const finalResponse = {
            accounts: result.results.data,
        };
        return sendSuccessResponse(res, 200, true, translate("customer_account_fetch_successfully"), "onepay", finalResponse);
    } catch (error) {
        next(error);
    }
    return false;
}
export default customerAccounts;
