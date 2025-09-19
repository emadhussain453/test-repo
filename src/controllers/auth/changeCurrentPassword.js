import { ApiError } from "../../utils/ApiError.js";
import passwordValidation from "../../utils/passwordValidation.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import SEND_SANITIZED_SUCCESS_RESPONSE from "../../utils/responses/sendSanitizedSuccessResponse.js";
import { EventTypes, Lenguages, NotificationTitles, NotificationTypes } from "../../constants/index.js";
import Event from "../../Events/databaseLogs.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";

async function changeCurrentPassword(req, res, next) {
    try {
        const { user, userIpAddress, body: { currentPassword, newPassword, confirmNewPassword } } = req;
        const { t: translate } = req;

        // password validation
        if (passwordValidation.match(newPassword, confirmNewPassword) !== true) throw new ApiError("Invalid Details", 400, translate("passwords_mismatced"), true);
        if (passwordValidation.length(newPassword) !== true) throw new ApiError("Invalid Details", 400, translate("password_length_is_invalid"), true);
        if (passwordValidation.strength(newPassword) !== true) throw new ApiError("Invalid Details", 400, translate("password_is_weak"), true);

        let userVerified = false;
        try {
            const isPasswordMatched = await user.bcryptComparePassword(currentPassword);
            userVerified = isPasswordMatched;
        } catch (error) {
            userVerified = false;
        }

        if (!userVerified) {
            throw new ApiError("Invalid Credentials", 400, translate("incorrect_current_password"), true);
        }

        if (currentPassword === newPassword) {
            throw new ApiError("Invalid Credentials", 400, translate("current_and_new_password_must_be_different"), true);
        }
        user.password = newPassword;
        await user.save();

        // log user notification
        const eventData = {
            userId: user._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("password_reset_successfully"),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("password_reset_successfully"),
            title: NotificationTitles.Account_Activity,
            type: NotificationTypes.AccountActivity,
            userIpAddress,
        };
        Event.emit(EventTypes.Notification, eventData);
        const sanitizedUser = SEND_SANITIZED_SUCCESS_RESPONSE(user);
        return sendSuccessResponse(res, 200, true, translate("password_reset_successfully"), "reset Password", sanitizedUser);
    } catch (error) {
        next(error);
    }
    return false;
}
export default changeCurrentPassword;
