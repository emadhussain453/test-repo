/* eslint-disable camelcase */
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import generateUniqueId from "../../utils/generateUniqueId.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function CreateOnepayClient(req, res, next) {
    try {
        const { translate, user: { _id, onepayCustomerId: userOnepayId, firstName: first_name, lastName: last_name, email, phoneNumber, kyc, dateOfBirth } } = req;
        if (userOnepayId) {
            return sendSuccessResponse(res, 200, true, translate("create_payment_success"), { id: userOnepayId }, false);
        }
        const invoiceId = generateUniqueId("onepay");
        const Headers = {
            accept: "application/json",
            "x-idempotency": invoiceId,
            "content-type": "application/json",
        };
        let document_type = kyc?.d24DocumentType;
        if (document_type === "PASS") document_type = "PASSPORT";
        const apiBody = {
            user_type: "natural",
            first_name,
            last_name,
            email,
            phone: phoneNumber,
            document_type,
            document_number: kyc?.documentIdNumber,
            nationality: "CO",
            birthdate: dateOfBirth,
            enable_notifications: false,
        };
        const result = await callApi.onepay("onepay", "createCustomers", "post", apiBody, false, Headers);
        if (!result.success) throw new ApiError("Error in onePay Api", 400, translate("directa_api_error", { message: result.message }), true);
        const { id: onepayCustomerId } = result.results;
        await Users.updateOne({ _id }, { $set: { onepayCustomerId } });
        return sendSuccessResponse(res, 200, true, translate("create_payment_success"), result.results, false);
    } catch (error) {
        next(error);
    }
    return false;
}
export default CreateOnepayClient;
