import { EventTypes, Lenguages, NotificationTitles, NotificationTypes, OtpTypes } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import SEND_SANITIZED_SUCCESS_RESPONSE from "../../utils/responses/sendSanitizedSuccessResponse.js";
import Event from "../../Events/databaseLogs.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import SendOtpWithNotificationV3 from "../../utils/SendOtpWithNotificationV3.js";

async function EmailVerify(req, res, next) {
    try {
        const { user, userIpAddress, translate } = req; // Destructure 't' from req object

        // if email is already verified
        if (user.emailVerified) {
            throw new ApiError("already verified", 400, translate("email_already_verified"), true);
        }
        // now update the user
        user.emailVerified = true;
        await user.save();

        const language = req.headers["accept-language"] || user?.language || Lenguages.English;
        const mobileTemplate = translate("verify_mobile");
        await SendOtpWithNotificationV3({ email: user.email, phoneNumber: user.phoneNumber, language, otpType: OtpTypes.VerifyMobile, onMobile: true, onEmail: false, resendOtp: false, templates: chooseEmailTemplateAndMessage(false, mobileTemplate, false) });
        const sanitizedUser = SEND_SANITIZED_SUCCESS_RESPONSE(user);

        // log user notification
        const eventData = {
            userId: user._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("email_verified_success"),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("email_verified_success"),
            title: NotificationTitles.Account_Activity,
            type: NotificationTypes.AccountActivity,
            userIpAddress,
        };
        Event.emit(EventTypes.Notification, eventData);
        return sendSuccessResponse(res, 200, true, translate("email_verified_success"), "verify Email", sanitizedUser);
    } catch (error) {
        next(error);
    }
}

export default EmailVerify;
