import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function GetDocuments(req, res, next) {
    try {
        const { user, translate } = req;
        const { aiPraise: { profileId } } = user;

        const result = await callApi.AiPrise("aiPrise", "getUserDocuments", "get", null, `/${profileId}`);
        if (!result.success) throw new ApiError("Error in AiPrise Api", 400, translate("3P_api_error", { message: result.message }), true);

        const finalResponse = {
            data: result.results?.files,
        };
        return sendSuccessResponse(res, 200, true, translate("documents_fetched_success"), "fetch documents", finalResponse);
    } catch (error) {
        next(error);
    }
}
export default GetDocuments;
