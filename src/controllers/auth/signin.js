import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import { OtpTypes } from "../../constants/index.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import SEND_SANITIZED_SUCCESS_RESPONSE from "../../utils/responses/sendSanitizedSuccessResponse.js";
import capitalizeName from "../../utils/capitalizeName.js";
import SendOtpWithNotificationV3 from "../../utils/SendOtpWithNotificationV3.js";
import logger from "../../logger/index.js";

async function SignIn(req, res, next) {
    try {
        const { email, password } = req.body;
        const { t: translate } = req;
        const userExists = await Users.findOne({ email: email.toLowerCase() }).select(" email password phoneNumber firstName lastName kyc kycStatus userName country isDeleted flag mobileVerified isVerified emailVerified language ");
        if (!userExists) throw new ApiError("Invalid Credentials", 400, translate("incorrect_email_or_password"), true);

        const userVerified = await userExists.bcryptComparePassword(password);
        if (!userVerified) {
            throw new ApiError("Invalid Credentials", 400, translate("incorrect_email_or_password"), true);
        }
        if (userExists?.isDeleted ?? false) {
            throw new ApiError(translate("Access denied"), 400, translate("account_deleted"), true);
        }
        const emailMessage = translate("onetime_login_verification_email_body_message");
        const mobileTemplate = translate("login");
        const emailTemplate = translate("otp_notification_template");

        let sendNotificationOnMobile = true;
        if (!userExists.mobileVerified) {
            sendNotificationOnMobile = false;
        }
        const language = req.headers["accept-language"];
        const fullName = `${capitalizeName(userExists.firstName)} ${capitalizeName(userExists.lastName)}`;
        const response = await SendOtpWithNotificationV3({ email: userExists.email, phoneNumber: userExists.phoneNumber, language, otpType: OtpTypes.Signin, onMobile: sendNotificationOnMobile, onEmail: true, resendOtp: false, templates: chooseEmailTemplateAndMessage(emailTemplate, mobileTemplate, { message: emailMessage, fullName }) });
        const sanitizedUser = SEND_SANITIZED_SUCCESS_RESPONSE(userExists);
        sanitizedUser.country.documentCountry = userExists?.kyc?.countryCode;
        logger.info(`User :: ${userExists._id} has called signed api successfully`);
        return sendSuccessResponse(res, 200, true, translate("send_otp_success", { message: response.message }), "signinOtp", sanitizedUser);
    } catch (error) {
        next(error);
    }
}

export default SignIn;
