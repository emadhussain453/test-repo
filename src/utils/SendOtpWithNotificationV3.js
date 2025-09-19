/* eslint-disable no-param-reassign */
/* eslint-disable require-atomic-updates */
import otpGenerator from "./otpGenerator.js";
import getEmailSubject from "./getEmailSubjects.js";
import { ExpirySeconds, NotificationPriority } from "../constants/index.js";
import { translateWithLenguageSpecifiedV1 } from "../middlewares/transalations.js";
import redisClient from "../config/redis.js";
import sendEmailOrMessageV3 from "./sendEmailOrMessageV3.js";
import getFromCache from "./cache/getFromCache.js";
import addMinutesToCurrentDate from "./addMinutesToCurrentDate.js";
import SetOtp from "./setOtp.js";
import keys from "../config/keys.js";

const createFinalMessage = async (otpType, onEmail, onMobile, language) => {
    let finalMessage = "A ";
    const email = await translateWithLenguageSpecifiedV1(language)("create_message_email");
    const message = await translateWithLenguageSpecifiedV1(language)("create_message_message");
    const hasBeenSent = await translateWithLenguageSpecifiedV1(language)("create_message_has_been_sent");
    const otpSent = await translateWithLenguageSpecifiedV1(language)("create_message_otp_has_been_sent");
    const onBoth = await translateWithLenguageSpecifiedV1(language)("create_message_on_both_email_and_mobile");
    const onlyOnEmail = await translateWithLenguageSpecifiedV1(language)("create_message_only_on_email");
    const onlyOnMobile = await translateWithLenguageSpecifiedV1(language)("create_message_only_on_mobile");

    if (otpType && onEmail && onMobile) {
        finalMessage += `${otpSent} ${onBoth}`;
    } else if (otpType && onEmail) {
        finalMessage += `${otpSent} ${onlyOnEmail}`;
    } else if (otpType && onMobile) {
        finalMessage += `${otpSent} ${onlyOnMobile}`;
    } else if (!otpType && onEmail && onMobile) {
        finalMessage += `${email} and ${message} ${onBoth}`;
    } else if (!otpType && onEmail) {
        finalMessage += `${email} ${hasBeenSent} ${onlyOnEmail}`;
    } else if (!otpType && onMobile) {
        finalMessage += `${message} ${hasBeenSent} ${onlyOnMobile}`;
    } else {
        finalMessage += "Notificatio has been sent successfully.";
    }

    return finalMessage;
};

const SendOtpWithNotificationV3 = async ({ email, phoneNumber, language, otpType, onMobile = false, onEmail = false, resendOtp = false, templates }) => {
    try {
        const otp = email === keys.TESTING_DEMO_ACCOUNT_EMAIL ? 131822 : otpGenerator();
        // if the otp is requested for multiple time within 30 sec,
        const checkUserOtpExpiry = await redisClient.ttl(`otp:${email}`);
        const otpExpiryInSeconds = ExpirySeconds.m10;

        const otpExpiry = addMinutesToCurrentDate(10);
        const reSendRemainingTime = otpExpiryInSeconds - 30;
        if (resendOtp && checkUserOtpExpiry > reSendRemainingTime) {
            const otpData = await getFromCache(`otp:${email}`);
            if (otpData.otpType === otpType) {
                return {
                    success: false,
                    message: checkUserOtpExpiry - reSendRemainingTime,
                };
            }
        }
        const otpPayload = {
            otp,
            otpType,
            otpExpiryInSeconds,
            otpExpiry,
            otpVerified: false,
        };

        await SetOtp(email, otpPayload);
        sendEmailOrMessageV3({ onMobile, onEmail, priority: NotificationPriority.ONE, email, phoneNumber, language, otp, emailSubject: await getEmailSubject(otpType, language), templates });

        return {
            success: true,
            message: await createFinalMessage(otpType, onEmail, onMobile, language),
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

export default SendOtpWithNotificationV3;
