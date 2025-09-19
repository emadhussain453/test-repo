import mongoose from "mongoose";
import moment from "moment";
import Users from "../../models/users.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import SEND_SANITIZED_SUCCESS_RESPONSE from "../../utils/responses/sendSanitizedSuccessResponse.js";
import signJwtToken from "../../utils/signJWT.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import { ApiError } from "../../utils/ApiError.js";
import { OtpTypes, CountryCodes, Genders, Lenguages, EventTypes, StableActiveCountryCodes, NotificationPriority, FlagsWithColor, FlagsReasons, ScoreKeys } from "../../constants/index.js";
import signupAggregationMatchUser from "../../pipes/signupMatchDetailsAggregation.js";
import logger from "../../logger/index.js";
import capitalizeName from "../../utils/capitalizeName.js";
import HubspotEvents from "../../Events/hubspot.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import SendOtpWithNotificationV3 from "../../utils/SendOtpWithNotificationV3.js";
import signRefreshToken from "../../utils/signRefreshToken.js";
import UserBalance from "../../models/userBalance.js";
import FlagsHistory from "../../models/flagsHistory.js";
import Event from "../../Events/databaseLogs.js";

async function SignUp(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session };
    try {
        const { t: translate, userIpAddress: ip } = req;
        const { firstName, lastName, email, dateOfBirth, phoneNumber, password, confirmPassword, notificationToken, deviceOS, deviceModel, deviceId, gender } = req.body;
        let { countryCode } = req.body;
        countryCode = countryCode?.toUpperCase();
        if (!Object.keys(StableActiveCountryCodes).includes(countryCode)) {
            throw new ApiError("Invalid Details", 400, translate("service_not_allowed"), true);
        }

        const currentUserDetails = { email: email.toLowerCase(), phoneNumber, firstName: firstName.toLowerCase(), lastName: lastName.toLowerCase(), dateOfBirth };
        const queryAggregation = signupAggregationMatchUser(currentUserDetails);
        const isUnique = await Users.aggregate(queryAggregation);
        const [message] = isUnique;
        if (message?.error) {
            const { email: regEmail, phoneNumber: regPhone } = message;
            const finalObj = {};
            if (regEmail) finalObj.email = translate("email_already_registered", { email });
            if (regPhone) finalObj.phoneNumber = translate("phoneNumber_already_registered", { phoneNumber });
            return res.status(400).json(finalObj);
        }

        // user add to database
        const userData = {
            country: {
                country: CountryCodes[countryCode],
                countryCode,
            },
            termsAndConditions: true,
            ip,
            ...req.body,
        };

        // save user language
        const languageFromHeaders = req.headers["accept-language"];
        const languageToSave = Object.values(Lenguages).includes(languageFromHeaders) ? languageFromHeaders : Lenguages.English;

        if (languageToSave) {
            userData.language = languageToSave;
        }
        // if the notification token exists
        const lastLoginAt = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
        // if (notificationToken && Expo.isExpoPushToken(notificationToken)) {
        userData.devices = [{
            notificationToken,
            isMainDevice: true,
            deviceOS,
            deviceModel,
            loginStatus: true,
            notificationStatus: true,
            deviceId,
            lastLoginAt,
        }];
        // }
        const newUser = new Users(userData);
        if (!newUser) {
            throw new ApiError("Db Error", 500, translate("error_while_creating_user"), true);
        }
        const newUserDataBalance = {
            userId: newUser._id,
        };
        const newUserBalance = new UserBalance(newUserDataBalance);
        if (!newUserBalance) {
            throw new ApiError("Db Error", 500, translate("error_while_creating_user"), true);
        }
        newUser.userBalance = newUserBalance._id;
        try {
            await newUser.save(opts);
            await newUserBalance.save(opts);
            // commit and end transaction
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            logger.error("Aborting SignUp transaction");
            await session.abortTransaction();
            session.endSession();
            throw new ApiError("Invalid details", 400, error.message, true);
        }
        const userId = newUser._id;
        if (ip && deviceId) {
            // this event update the flag if user signup with someone old same ip and deviceId
            const deviceEventData = {
                userId,
                deviceId,
                ip,
            };
            Event.emit(EventTypes.checkForSameIpAndDevice, deviceEventData);
        }
        const tokenVersion = 0;
        const token = signJwtToken(newUser._id, tokenVersion, deviceId);
        const payload = {
            userId: newUser._id,
        };
        const refreshToken = signRefreshToken(payload);
        const sanitizedUser = SEND_SANITIZED_SUCCESS_RESPONSE(newUser);
        sanitizedUser.token = token;
        sanitizedUser.devices = newUser.devices;
        sanitizedUser.refreshToken = refreshToken;

        // saving refreshToken
        try {
            newUser.refreshToken = refreshToken;
            await newUser.save();
        } catch (error) {
            logger.error(`error in saving refresh-token :: ${error}`);
        }

        // send email to user
        const language = userData?.language;
        const emailMessage = translate("onetime_verifyEmail_verification_email_body_message");
        const emailTemplate = translate("otp_notification_template");
        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
        await SendOtpWithNotificationV3({ email: newUser.email, phoneNumber: userData.phoneNumber, language, otpType: OtpTypes.VerifyEmail, onMobile: false, onEmail: true, templates: chooseEmailTemplateAndMessage(emailTemplate, false, { message: emailMessage, fullName }) });

        if (notificationToken) {
            const title = language === Lenguages.Spanish ? "Registro exitoso." : "Wooohooo 🎊";
            const messageNoti = language === Lenguages.Spanish ? "¡Bienvenido al Mundo Stable!" : "Welcome to Stable World!";
            const userToken = [notificationToken];
            await notificationsQueue.add("pushNotification", {
                title,
                message: messageNoti,
                tokens: userToken,
            }, { priority: NotificationPriority.THREE });
        }
        // send user dtails to hubspot
        const userPayload = {
            email,
            firstname: firstName,
            lastname: lastName,
            phone: phoneNumber,
        };
        if (process.env.NODE_ENV === "production") HubspotEvents.emit(EventTypes.CreateUserOnHubspot, userPayload);
        return sendSuccessResponse(res, 201, true, translate("user_registered_successfully"), "registerUser", sanitizedUser);
    } catch (error) {
        next(error);
    }
}

export default SignUp;
