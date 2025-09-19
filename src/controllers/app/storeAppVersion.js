import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import AppDetailes from "../../models/appVersion.js";

const StoreAppVersion = async (req, res, next) => {
    try {
        const { translate, body: { name, version } } = req;
        if (!name) throw new ApiError("invalid details", 400, translate("name_required"), true);
        if (!version) throw new ApiError("invalid details", 400, translate("version_required"), true);
        const app = new AppDetailes({
            name,
            version,
        });
        await app.save();
        return sendSuccessResponse(res, 200, true, translate("app_details_save"), "app-data", app);
    } catch (error) {
        next(error);
    }
    return false;
};

export default StoreAppVersion;
