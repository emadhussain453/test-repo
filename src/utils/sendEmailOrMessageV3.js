import { NotificationPriority } from "../constants/index.js";
import { translateWithLenguageSpecifiedV1 } from "../middlewares/transalations.js";
import notificationsQueue from "../queues/notificationQueue.js";

const defaultEmailTemplate = async (otp, additionalData, language) => {
    const msg = await translateWithLenguageSpecifiedV1(language)("email_message", { otp });
    return msg;
};
const defaultMobileOtpMessage = async (otp, additionalData, language) => {
    const msg = await translateWithLenguageSpecifiedV1(language)("mobile_message", { otp });
    return msg;
};

const defaultEmailSubject = "Stable verification code";

const sendEmailOrMessageV3 = async ({ onMobile = false, onEmail = false, priority = null, email, phoneNumber, language, otp, emailSubject = defaultEmailSubject, templates }) => {
    try {
        const userLanguage = language ?? "en";
        let { emailTemplate = defaultEmailTemplate, mobileOtpMessage = defaultMobileOtpMessage } = templates || {};
        if (!emailTemplate) emailTemplate = defaultEmailTemplate; // if emailTemplate is not provided or its false, use defaultEmailTemplate
        if (!mobileOtpMessage) mobileOtpMessage = defaultMobileOtpMessage; // if mobileOtpMessage is not provided or its false, use defaultMobileOtpMessage

        let emailPriority = NotificationPriority.TWO;
        let mobilePriority = NotificationPriority.TWO;
        if (priority) {
            emailPriority = priority;
            mobilePriority = priority;
        }
        if (onEmail) {
            await notificationsQueue.add("email", {
                email,
                subject: emailSubject,
                message: await emailTemplate(otp, templates.additionalData, userLanguage),
            }, {
                priority: emailPriority,
                attempts: 3,
                backoff: {
                    type: "fixed",
                    delay: 5000,
                },
            });
        }

        if (onMobile && process.env.NODE_ENV === "production") {
            await notificationsQueue.add("sms", {
                phoneNumber,
                message: await mobileOtpMessage(otp, templates.additionalData, userLanguage),
            }, {
                priority: mobilePriority,
                attempts: 3,
                backoff: {
                    type: "fixed",
                    delay: 5000,
                },
            });
        }

        return [onEmail, onMobile];
    } catch (error) {
        throw new Error(error);
    }
};

export default sendEmailOrMessageV3;
