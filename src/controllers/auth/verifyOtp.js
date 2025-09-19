import Users from "../../models/users.js";
import SEND_SANITIZED_SUCCESS_RESPONSE from "../../utils/responses/sendSanitizedSuccessResponse.js";
import signJwtToken from "../../utils/signJWT.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { CountryCurrencies, EventTypes, Lenguages, NotificationTitles, NotificationTypes, OtpTypes } from "../../constants/index.js";
import Event from "../../Events/databaseLogs.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import SendOtpWithNotificationV3 from "../../utils/SendOtpWithNotificationV3.js";
import setToCache from "../../utils/cache/setToCache.js";
import deleteFromCache from "../../utils/cache/deleteFromCache.js";
import GetOtp from "../../utils/getOtp.js";
import SetOtpValues from "../../utils/setOtpValues.js";
import signRefreshToken from "../../utils/signRefreshToken.js";
import UserBalance from "../../models/userBalance.js";

async function VerifyOtp(req, res, next) {
    let otpType = OtpTypes.Signin;
    try {
        const { otp, email, type, notificationToken, deviceOS, deviceModel, deviceId } = req.body;
        const { t: translate, userIpAddress } = req;

        if (!Object.values(OtpTypes).includes(type)) throw new ApiError("Invalid request", 400, translate("invalid_otp_types"), true);
        const user = await Users.findOne({ email });
        if (!user) {
            throw new ApiError("Invalid Details", 400, translate("user_not_found_or_new_otp"), true);
        }
        if (user?.isDeleted ?? false) {
            throw new ApiError(translate("Access denied"), 400, translate("account_deleted"), true);
        }
        const userBalance = await UserBalance.findOne({ userId: user._id });
        if (!userBalance) throw new ApiError(translate("Access denied"), 401, translate("user_balance_not_found"), true);
        const { _id } = user;
        const key = `otp:${email}`;
        const userOtpData = await GetOtp(email);
        // check otp expiry
        const currentTime = new Date().getTime();
        if (user.otpExpiry < currentTime) {
            await SetOtpValues(user._id);
            throw new ApiError("Invalid Details", 400, translate("otp_expired"), true);
        }
        if (userOtpData.otp !== otp) throw new ApiError("Invalid Details", 400, translate("invalid_otp"), true);
        if (userOtpData.otpType !== type) throw new ApiError("Invalid request :: OTP cross-usage", 400, translate("otp_type_mismatch"));
        await deleteFromCache(key);
        // if otp is valid and hasnt expired and type is signin then return the user and token
        if (type === OtpTypes.Signin && userOtpData.otpType === OtpTypes.Signin) {
            const sanitizedUser = SEND_SANITIZED_SUCCESS_RESPONSE(user);

            sanitizedUser.balance = userBalance.balance;
            sanitizedUser.createdAt = user.createdAt;
            // this event update the devices information and set otpValues null
            const deviceEventData = {
                devices: user.devices,
                userId: user._id,
                language: user.language,
                notificationToken,
                deviceId,
                deviceOS,
                deviceModel,
                userIpAddress,
            };
            Event.emit(EventTypes.UpdateDevicesInformation, deviceEventData);

            // log user notification
            const eventData = {
                userId: user._id,
                message: await translateWithLenguageSpecifiedV1(Lenguages.English)("signin_notification", { firstName: user.firstName }),
                spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("signin_notification", { firstName: user.firstName }),
                title: NotificationTitles.Account_Activity,
                type: NotificationTypes.AccountActivity,
                userIpAddress,
            };

            Event.emit(EventTypes.Notification, eventData);
            const tokenVersion = user.tokenVersion + 1;
            user.tokenVersion = tokenVersion;

            let response = {
                message: "Login succesfull",
            };

            const token = signJwtToken(user._id, tokenVersion, deviceId);
            const payload = {
                userId: user._id,
            };
            const refreshToken = signRefreshToken(payload);
            const finalResponse = { ...sanitizedUser, token, refreshToken, devices: user.devices };
            finalResponse.passCode = false;
            if (user.passCode) finalResponse.passCode = true;

            if (!user.emailVerified) {
                user.emailVerified = true;
                finalResponse.emailVerified = true;
            }
            user.refreshToken = refreshToken;
            user.ip = userIpAddress;
            await user.save(); // dont change its position
            finalResponse.country.documentCountry = user?.kyc?.countryCode;
            finalResponse.currency = CountryCurrencies[user?.country?.countryCode];
            if (!user.mobileVerified) {
                otpType = OtpTypes.VerifyMobile;
                const language = user?.language || req.headers["accept-language"] || Lenguages.English;
                const mobileTemplate = language === Lenguages.Spanish ? "VerifyMobileSpanish" : "VerifyMobile";
                response = await SendOtpWithNotificationV3({ email: user.email, phoneNumber: user.phoneNumber, language, otpType: OtpTypes.VerifyMobile, onEmail: false, onMobile: true, templates: chooseEmailTemplateAndMessage(false, mobileTemplate, false) });
                return sendSuccessResponse(res, 200, true, response.message, otpType, finalResponse);
            }

            return sendSuccessResponse(res, 200, true, translate("login_successful"), "login", finalResponse);
        }

        // means otp is valid and hasnt expired
        const isOtpVerified = true;
        await Promise.all([
            await setToCache(`otp-verified:${email}`, isOtpVerified),
            await Users.updateOne({ _id }, { $set: { otpVerified: true } }),
        ]);

        return sendSuccessResponse(res, 200, true, translate("verify_otp"), "verify Otp");
    } catch (error) {
        next(error);
    }
}

export default VerifyOtp;
