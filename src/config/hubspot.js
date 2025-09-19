import callApi from "../utils/callApi.js";
import { ApiError } from "../utils/ApiError.js";

const generateSecretTokenForHubspotuser = async ({ email, firstName, lastName }) => {
    const IdentificationTokenGenerationRequest = { email, firstName, lastName };

    try {
        const hubspotResponse = await callApi.hubspot("hubspot", "startChat", "post", IdentificationTokenGenerationRequest, false, true);
        if (!hubspotResponse.success) {
            throw new ApiError("hubspot", 400, hubspotResponse.message, true);
        }
        const { results: { token } } = hubspotResponse;
        return token;
    } catch (e) {
        throw new Error(e);
    }
};

export default generateSecretTokenForHubspotuser;
