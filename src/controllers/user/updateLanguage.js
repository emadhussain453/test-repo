import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import SEND_SANITIZED_SUCCESS_RESPONSE from "../../utils/responses/sendSanitizedSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";

const updateLanguage = async (req, res, next) => {
    try {
        const { language } = req.body;
        const { user, translate } = req;
        if (user?.language === language) {
            throw new ApiError("Validation Error", 400, await translate("language_active", { language }), true);
        }

        user.language = language;
        await user.save();
        const sanitizedUser = SEND_SANITIZED_SUCCESS_RESPONSE(user);

        return sendSuccessResponse(res, 200, true, await translateWithLenguageSpecifiedV1(language)("language_update_success"), "language", sanitizedUser);
    } catch (error) {
        next(error);
    }
    return false;
};

export default updateLanguage;
