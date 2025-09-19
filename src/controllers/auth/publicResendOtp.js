import Users from "../../models/users.js";
import { PublicOtpTypes } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import capitalizeName from "../../utils/capitalizeName.js";
import SendOtpWithNotificationV3 from "../../utils/SendOtpWithNotificationV3.js";

const publicResendOtp = async (req, res, next) => {
    try {
        const { body: { type, email }, t: translate } = req; // Destructure 't' from req object
        const user = await Users.findOne({ email }).select("email firstName isDeleted lastName phoneNumber language").lean();
        if (user?.isDeleted ?? false) {
            throw new ApiError(translate("Access denied"), 400, translate("account_deleted"), true);
        }
        if (!user) throw new ApiError("Invalid Details", 400, translate("user_not_found"), true);
        if (PublicOtpTypes.ForgetPasswordEmail !== type) throw new ApiError("Invalid Details", 400, translate("invalid_otp_types"), true);

        const language = user?.language || req.headers["accept-language"];
        const emailTemplate = translate("otp_notification_template");
        const mobileTemplate = translate("otp_verification");
        const emailMessage = translate("onetime_verification_email_body_message");

        const fullName = `${capitalizeName(user.firstName)} ${capitalizeName(user.lastName)}`;
        const message = await SendOtpWithNotificationV3({ email: user.email, phoneNumber: user.phoneNumber, language, otpType: type, onMobile: true, onEmail: true, resendOtp: true, templates: chooseEmailTemplateAndMessage(emailTemplate, mobileTemplate, { message: emailMessage, fullName }) });
        if (typeof message === "object" && !message.success) {
            throw new ApiError("sendOtp error", 400, translate("send_otp_error", { message: message.message }), true);
        }
        return sendSuccessResponse(res, 200, true, translate("resend_otp_success"), "resendOtp");
    } catch (error) {
        next(error);
    }
    return publicResendOtp;
};

export default publicResendOtp;
