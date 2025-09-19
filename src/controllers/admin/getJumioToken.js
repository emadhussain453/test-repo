import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import GetJumioAccessToken from "../../utils/jumio/getJumioAccessToken.js";

async function GetJumioToken(req, res, next) {
    try {
        const { t: translate } = req;
        const jumioToken = await GetJumioAccessToken();
        const finalResponse = {
            token: jumioToken,
        };
        return sendSuccessResponse(res, 200, true, translate("jumio_token_api_successfull"), "jumioAuthToken", finalResponse);
    } catch (error) {
        next(error);
    }
}

export default GetJumioToken;
