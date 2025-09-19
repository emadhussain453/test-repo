import generateSecretTokenForHubspotuser from "../../config/hubspot.js";
import KEYS from "../../config/keys.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const startAChat = async (req, res, next) => {
    try {
        const { email, firstName, lastName } = req.user;
        const userbasicDetails = {
            email,
            firstName,
            lastName,
        };
        const hubSpotuserToken = await generateSecretTokenForHubspotuser(userbasicDetails);
        const URL = `${KEYS.DOMAIN}html/index.html?email=${email}&token=${hubSpotuserToken}`;
        const finalResponse = {
            URL,
        };
        sendSuccessResponse(res, 200, true, "Ready for a chat", "startHubspotchat", finalResponse);
    } catch (error) {
        next(error);
    }
    return false;
};
export default startAChat;
