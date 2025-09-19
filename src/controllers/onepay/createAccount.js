/* eslint-disable camelcase */
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import generateUniqueId from "../../utils/generateUniqueId.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function CreateOnepayAccount(req, res, next) {
    try {
        const { translate, user: { _id, onepayCustomerId }, body: { subtype, bank_id, account_number } } = req;
        const invoiceId = generateUniqueId("onepay");
        const Headers = {
            accept: "application/json",
            "x-idempotency": invoiceId,
            "content-type": "application/json",
        };
        const apiBody = {
            subtype,
            authorization: false,
            "re-enrollment": false,
            account_number,
            external_id: _id,
            customer_id: onepayCustomerId,
            bank_id,
        };
        const result = await callApi.onepay("onepay", "createAccount", "post", apiBody, false, Headers);
        if (!result.success) throw new ApiError("Error in onePay Api", 400, translate("directa_api_error", { message: result.message }), true);
        return sendSuccessResponse(res, 200, true, translate("create_payment_success"), result.results, false);
    } catch (error) {
        next(error);
    }
    return false;
}
export default CreateOnepayAccount;
