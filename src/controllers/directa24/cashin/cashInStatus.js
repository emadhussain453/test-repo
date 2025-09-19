import { ApiError } from "../../../utils/ApiError.js";
import print from "../../../utils/print.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import callApi from "../../../utils/callApi.js";
import createAuthHash from "../../../utils/directa24/createAuthHash.js";
import logger from "../../../logger/index.js";

async function cashinStatus(req, res, next) {
    try {
        const { translate } = req;
        const { depositeId } = req.body;

        if (!depositeId) {
            throw new ApiError("invalid details", 400, translate("depositeId_required"), true);
        }

        const authHeaders = createAuthHash();
        const result = await callApi.callDirecta24Api("directa24CashInThroughPSE", "cashInStatus", "GET", null, depositeId, authHeaders);
        print("result", result);

        if (!result.success) {
            logger.error(`D24 :: ${result.message}`);
            throw new ApiError("directa api error", 400, translate("something_went_wrong"), true);
        }

        return sendSuccessResponse(res, 200, true, translate("cashout_success"), result.results, false);
    } catch (error) {
        print("main", error.message);
        next(error);
    }
    return false;
}

export default cashinStatus;
