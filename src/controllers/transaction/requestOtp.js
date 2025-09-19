import { OtpTypes } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import capitalizeName from "../../utils/capitalizeName.js";
import SendOtpWithNotificationV3 from "../../utils/SendOtpWithNotificationV3.js";

async function requestp2pOtp(req, res, next) {
    try {
        const { user, translate } = req;
        const language = req.headers["accept-language"] || user?.language;
        const emailMessage = translate("onetime_p2p_verification_email_body_message");
        const emailTemplate = translate("otp_notification_template");
        const mobileTemplate = translate("p2p_transaction_template");
        const fullName = `${capitalizeName(user.firstName)} ${capitalizeName(user.lastName)}`;
        const response = await SendOtpWithNotificationV3({ email: user.email, phoneNumber: user.phoneNumber, language, otpType: OtpTypes.TransactionP2P, onMobile: true, onEmail: true, resendOtp: false, templates: chooseEmailTemplateAndMessage(emailTemplate, mobileTemplate, { message: emailMessage, fullName }) });
        if (!response.success) {
            throw new ApiError("sendOtp error", 400, translate("send_otp_error", { message: response.message }), true);
        }
        return sendSuccessResponse(res, 200, true, translate("send_otp_success", { message: response.message }), "transactionOtp");
    } catch (error) {
        next(error);
    }
    return false;
}
export default requestp2pOtp;
