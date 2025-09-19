import { ApiError } from "../../utils/ApiError.js";
import getAppConfig from "../../utils/getAppConfig.js";
import getUserCashinVolume from "../../utils/getUserCashinVolume.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const cashinValume = async (req, res, next) => {
    try {
        const { translate, user: { _id } } = req;
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        const { cashin: { checkDays } } = app;
        const volume = await getUserCashinVolume(_id, checkDays);
        const finalResponse = {
            volume,
        };
        return sendSuccessResponse(res, 200, true, translate("cashin_volume_fetch"), null, finalResponse);
    } catch (error) {
        next(error);
    }
    return cashinValume;
};
export default cashinValume;
