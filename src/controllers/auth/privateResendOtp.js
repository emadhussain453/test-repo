import Users from "../../models/users.js";
import { Lenguages, OtpTypes, PrivateOtpTypes } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import capitalizeName from "../../utils/capitalizeName.js";
import SendOtpWithNotificationV3 from "../../utils/SendOtpWithNotificationV3.js";

const privateResendOtp = async (req, res, next) => {
    try {
        const { user: { _id }, body: { type }, translate } = req;
        const user = await Users.findOne({ _id });
        if (user?.isDeleted ?? false) {
            throw new ApiError(translate("Access denied"), 401, translate("account_deleted"), true);
        }
        if (user?.isBlocked ?? false) {
            throw new ApiError(translate("Access denied"), 401, translate("account_blocked"), true);
        }
        const OtpTypesValues = Object.values(PrivateOtpTypes);
        if (!user) throw new ApiError("Invalid Details", 400, translate("user_not_found"), true);
        if (!OtpTypesValues.includes(type)) throw new ApiError("Invalid Details", 400, translate("invalid_otp_types"), true);

        if (type === OtpTypes.VerifyEmail && user.emailVerified) throw new ApiError("Invalid Details", 400, translate("email_already_verified"), true);
        if (type === OtpTypes.VerifyMobile && user.mobileVerified) throw new ApiError("Invalid Details", 400, translate("mobile_number_already_verified"), true);
        const language = req.headers["accept-language"];
        const emailTemplate = (user?.language || language) === Lenguages.Spanish ? "OtpNotificationTemplateSpanish" : "OtpNotificationTemplate";
        const mobileTemplate = (user?.language || language) === Lenguages.Spanish ? "OtpVerificationSpanish" : "OtpVerification";
        const emailMessage = translate("onetime_verification_email_body_message");

        let sendOtpOnMobile = false;
        let sendOtpOnEmail = false;
        if (type === OtpTypes.VerifyEmail) {
            sendOtpOnEmail = true;
        }
        if (type === OtpTypes.VerifyMobile) {
            sendOtpOnMobile = true;
        }

        if (type !== OtpTypes.VerifyMobile && type !== OtpTypes.VerifyEmail) {
            sendOtpOnEmail = true;
            sendOtpOnMobile = true;
        }
        const fullName = `${capitalizeName(user.firstName)} ${capitalizeName(user.lastName)}`;
        const message = await SendOtpWithNotificationV3({ email: user.email, phoneNumber: user.phoneNumber, language, otpType: type, onMobile: sendOtpOnMobile, onEmail: sendOtpOnEmail, resendOtp: true, templates: chooseEmailTemplateAndMessage(emailTemplate, mobileTemplate, { message: emailMessage, fullName }) });
        if (typeof message === "object" && !message.success) {
            throw new ApiError("sendOtp error", 400, translate("send_otp_error", { message: message.message }), true);
        }
        return sendSuccessResponse(res, 200, true, translate("resend_otp_success"), null);
    } catch (error) {
        next(error);
    }
    return privateResendOtp;
};

export default privateResendOtp;
