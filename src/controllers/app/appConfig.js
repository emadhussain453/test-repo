import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import getAppConfig from "../../utils/getAppConfig.js";

const GetAppConfigurations = async (req, res, next) => {
    try {
        const { t: translate } = req;
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        return sendSuccessResponse(res, 200, true, translate("app_details_fetch"), "app-data", app);
    } catch (error) {
        next(error);
    }
    return false;
};

export default GetAppConfigurations;
