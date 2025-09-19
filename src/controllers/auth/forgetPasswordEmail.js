import Users from "../../models/users.js";
import { Lenguages, OtpTypes } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import capitalizeName from "../../utils/capitalizeName.js";
import SendOtpWithNotificationV3 from "../../utils/SendOtpWithNotificationV3.js";

async function ForgetPasswordEmail(req, res, next) {
    try {
        const { email } = req.body;
        const { t: translate } = req;
        // find if the email exists in the db
        const user = await Users.findOne({ email }).select("email firstName emailVerified isDeleted lastName phoneNumber language").lean();
        if (!user) {
            throw new ApiError("Invalid Cradentials", 400, translate("user_not_found_with_email"), true);
        }
        if (user?.isDeleted) {
            throw new ApiError(translate("Access denied"), 400, translate("account_deleted"), true);
        }
        const language = user.language || req.headers["accept-language"] || Lenguages.English;
        const emailTemplate = translate("otp_notification_template");
        const emailMessage = translate("forget_password_email_body_message");
        const fullName = `${capitalizeName(user.firstName)} ${capitalizeName(user.lastName)}`;
        const message = await SendOtpWithNotificationV3({ email: user.email, phoneNumber: user.phoneNumber, language, otpType: OtpTypes.ForgetPasswordEmail, onMobile: false, onEmail: true, resendOtp: false, templates: chooseEmailTemplateAndMessage(emailTemplate, false, { message: emailMessage, fullName }) });
        if (message?.success === false) {
            return sendSuccessResponse(res, 400, false, translate("send_otp_error", { message: message.message }));
        }
        return sendSuccessResponse(res, 200, true, translate("password_reset_token"), "forget Password", { emailVerified: user.emailVerified });
    } catch (error) {
        next(error);
    }
}

export default ForgetPasswordEmail;
