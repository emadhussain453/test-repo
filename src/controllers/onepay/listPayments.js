import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function listPayment(req, res, next) {
    try {
        const { translate } = req;
        const Headers = {
            accept: "application/json",
            "content-type": "application/json",
        };
        const result = await callApi.onepay("onepay", "createPayment", "get", null, false, Headers);
        if (!result.success) throw new ApiError("Error in onePay Api", 400, translate("directa_api_error", { message: result.message }), true);
        return sendSuccessResponse(res, 200, true, translate("create_payment_success"), result.results, false);
    } catch (error) {
        next(error);
    }
    return false;
}
export default listPayment;
