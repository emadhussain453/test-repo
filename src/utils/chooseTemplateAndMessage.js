import { EmailTemplates, OtpMessage } from "../constants/index.js";

function chooseEmailTemplateAndMessage(emailTemplateName = false, otpMessageName = false, additionalData = false) {
    const templates = {
        emailTemplate: emailTemplateName ? EmailTemplates[emailTemplateName] : false,
        mobileOtpMessage: otpMessageName ? OtpMessage[otpMessageName] : false,
        additionalData,
    };
    return templates;
}
export default chooseEmailTemplateAndMessage;
