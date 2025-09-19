import { ApiError } from "../ApiError.js";
import callApi from "../callApi.js";

async function getUserFromHubspot(actorId) {
    try {
        const params = `${actorId}`;
        const hubspotResponse = await callApi.hubspot("hubspot", "getUser", "get", false, params, true);
        if (!hubspotResponse.success) {
            throw new ApiError("hubspot", 400, hubspotResponse.message, true);
        }
        const { results } = hubspotResponse;
        return results;
    } catch (e) {
        throw new Error(e);
    }
}
export default getUserFromHubspot;
