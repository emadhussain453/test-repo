import { ApiError } from "../ApiError.js";
import callApi from "../callApi.js";

async function getMessage(objectId, messageId) {
    try {
        const params = `${objectId}/messages/${messageId}`;
        const hubspotResponse = await callApi.hubspot("hubspot", "getMessage", "get", false, params, true);
        if (!hubspotResponse.success) {
            throw new ApiError("hubspot", 400, hubspotResponse.message, true);
        }
        const { results } = hubspotResponse;
        return results;
    } catch (e) {
        throw new Error(e);
    }
}
export default getMessage;
