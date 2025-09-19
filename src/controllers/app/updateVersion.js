import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import AppDetailes from "../../models/appVersion.js";

const updateAppVersion = async (req, res, next) => {
    try {
        const { t: translate, body: { version } } = req;
        if (!version) throw new ApiError("invalid details", 400, translate("version_required"), true);
        const app = await AppDetailes.findOne({});
        if (!app) throw new ApiError("invalid details", 400, translate("app_not_found"), true);
        app.version = version;
        await app.save();
        return sendSuccessResponse(res, 200, true, translate("app_details_update"), "app-data", app);
    } catch (error) {
        next(error);
    }
    return false;
};

export default updateAppVersion;
