import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import SEND_SANITIZED_SUCCESS_RESPONSE from "../../utils/responses/sendSanitizedSuccessResponse.js";
import { EventTypes, Lenguages, NotificationTitles, NotificationTypes } from "../../constants/index.js";
import Event from "../../Events/databaseLogs.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import passwordValidation from "../../utils/passwordValidation.js";

async function ResetPassword(req, res, next) {
    try {
        const { userIpAddress, body: { password, confirmPassword, email } } = req;
        const { t: translate } = req;
        const Query = {
            email,
        };

        const user = await Users.findOne(Query).select("_id email phoneNumber tokenVersion firstName lastName dateOfBirth language");
        if (!user) {
            throw new ApiError("Invalid Credentials", 400, translate("user_not_found"), true);
        }
        if (user?.isDeleted ?? false) {
            throw new ApiError(translate("Access denied"), 401, translate("account_deleted"), true);
        }
        // password validation
        if (passwordValidation.match(password, confirmPassword) !== true) throw new ApiError("Invalid Details", 400, translate("passwords_mismatced"), true);
        if (passwordValidation.length(password) !== true) throw new ApiError("Invalid Details", 400, translate("password_length_is_invalid"), true);
        if (passwordValidation.strength(password) !== true) throw new ApiError("Invalid Details", 400, translate("password_is_weak"), true);
        user.otpVerified = false;
        user.otp = null;
        user.otpExpiry = null;
        user.otpType = null;
        user.otpExpiryInSeconds = null;

        user.password = password;
        user.tokenVersion += 1;
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
}
export default ResetPassword;
