/* eslint-disable comma-dangle */
import moment from "moment";
import crypto from "crypto";
import getCountryISO3 from "country-iso-2-to-3";
import logger from "../../logger/index.js";
import Users from "../../models/users.js";
import calculateAge from "../../utils/calculateAge.js";
import { InternationalCountryCodes, AiPriseIdTypes, AiPriseKycStatus, StableServicesIdTypes, DocumentTypes, Status, Lenguages, EventTypes, HubspotCustomerLifecycleStages, NotificationPriority, AppEnviornments, ScoreKeys } from "../../constants/index.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import HubspotEvents from "../../Events/hubspot.js";
import capitalizeName from "../../utils/capitalizeName.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import keys from "../../config/keys.js";
import Event from "../../Events/databaseLogs.js";
import callApi from "../../utils/callApi.js";

const getUserGender = (gender) => {
    switch (gender.toLowerCase()) {
        case "male":
            return "MALE";
        case "female":
            return "FEMALE";
        case "m":
            return "MALE";
        case "f":
            return "FEMALE";
        default:
            return "OTHER";
    }
};

const cleanNameString = (str) => str?.replace(/[_-]/g, " ");
const getD24AndPomeloDocumentType = (jumioUserCountryCode, documentType) => {
    let d24DocumentType = "CC";
    let pomeloDocumentType = "CC";

    if (jumioUserCountryCode !== "COL" && documentType === "PASSPORT") {
        d24DocumentType = "PASS";
        pomeloDocumentType = "PASSPORT";
        return { d24DocumentType, pomeloDocumentType };
    }

    const AiPriseIdTypesForCountry = AiPriseIdTypes[jumioUserCountryCode];// return object
    const StableServicesIdTypesForCountry = StableServicesIdTypes[jumioUserCountryCode]; // returns object

    switch (jumioUserCountryCode) {
        case InternationalCountryCodes.COL:
            if (documentType === AiPriseIdTypesForCountry.PASSPORT) {
                d24DocumentType = StableServicesIdTypesForCountry.PASSPORT; // PASS
                pomeloDocumentType = StableServicesIdTypesForCountry.PASSPORT_FOR_POMELO; // PASSPORT
            } else {
                d24DocumentType = StableServicesIdTypesForCountry.DRIVER_LICENSE; // CC
                pomeloDocumentType = StableServicesIdTypesForCountry.DRIVER_LICENSE; // CC
            }
            break;

        case InternationalCountryCodes.MEX:
        case InternationalCountryCodes.CHI:
            if (documentType === AiPriseIdTypesForCountry.PASSPORT) {
                d24DocumentType = StableServicesIdTypesForCountry.PASSPORT;
                pomeloDocumentType = StableServicesIdTypesForCountry.PASSPORT_FOR_POMELO;
            } else {
                d24DocumentType = StableServicesIdTypesForCountry.ID_CARD;
                pomeloDocumentType = StableServicesIdTypesForCountry.ID_CARD_FOR_POMELO;
            }
            break;

        default:
            break;
    }

    return { d24DocumentType, pomeloDocumentType };
};

const sendNotificationToUserAboutHisWorkflow = async (userDevices, title = "Kyc failed", message = "Something went wrong") => {
    const userActiveNotificationToken = activeNotificationTokenOfUser(userDevices);
    await notificationsQueue.add("pushNotification", {
        title,
        message,
        tokens: userActiveNotificationToken,
    }, { priority: NotificationPriority.TWO });
};

const markWorkFlowAsFailled = async (message, userId, userDevices, userLanguage, payload) => {
    try {
        await Users.updateOne({ _id: userId }, { $set: payload });
        const title = userLanguage === Lenguages.Spanish ? "KYC Fallido" : "Kyc Failed";
        await sendNotificationToUserAboutHisWorkflow(userDevices, title, message);
    } catch (error) {
        throw new Error(error.message);
    }
};

const markWorkFlowInReview = async (message, userId, userDevices, userLanguage, payload) => {
    try {
        await Users.updateOne({ _id: userId }, { $set: payload });
        const title = userLanguage === Lenguages.Spanish ? "KYC en revisar" : "KYC in Review";
        await sendNotificationToUserAboutHisWorkflow(userDevices, title, message);
    } catch (error) {
        throw new Error(error.message);
    }
};

const aiPraiseEvents = {
    VERIFICATION_SESSION_STARTED: 2, // in pending
    VERIFICATION_REQUEST_SUBMITTED: 3, // docs upload, in procesing
};

async function kycStatus(req, res, next) {
    try {
        const { body, headers } = req;
        const bodyAsString = req?.payloadAsString ?? JSON.stringify(body);
        const apiKey = keys.AiPraise.API_KEY;
        const hashVal = crypto
            .createHmac("sha256", apiKey)
            .update(Buffer.from(bodyAsString, "utf8"))
            .digest("hex")
            .toLowerCase();

        if (hashVal !== headers["x-hmac-signature"] && process.env.NODE_ENV === AppEnviornments.PRODUCTION) {
            logger.error("BAD AUTHENTICATION");
            logger.error({ hashVal, incommingHash: headers["x-hmac-signature"], payloadAsString: req.payloadAsString });
            return res.status(401).json({
                status: 401,
                message: "Unauthorized"
            });
        }
        const { verification_session_id: vSi, verification_result: caseStatus, status: ss, client_reference_id: cRI, event_type: eventType } = body;
        const user = await Users.findOne({ _id: cRI }).select("language firstName lastName kyc devices aiPraise email kycAttempts isVerified");
        if (!user) {
            return res.status(400).json({
                status: 400,
                message: "Invalid client refrance id",
            });
        }
        const { _id: userId, firstName: givenFirstName, lastName: givenLastName, kycAttempts, email, isVerified, language, devices, aiPraise: { status: aiPriseStatus } } = user;
        const totalAttempts = (kycAttempts ?? 0) + 1;

        if (aiPriseStatus === AiPriseKycStatus.APPROVED && isVerified === true) {
            logger.info(`User :: ${email} kyc has already completed`);
            return res.status(200).json({
                status: 200,
            });
        }
        let aiSummery = body.aiprise_summary || { verification_result: caseStatus }; let idInfo; let status = ss;
        if (eventType === "CASE_STATUS_UPDATE") {
            const result = await callApi.AiPrise("aiPrise", "getVerificatinResult", "get", null, `/${vSi}`);
            if (!result.success) {
                return res.status(400).json({
                    status: 400,
                    message: "Invalid client refrance id",
                });
            }
            aiSummery = { verification_result: caseStatus };
            idInfo = result.results.id_info;
            status = result.results.status;
        } else {
            aiSummery = body.aiprise_summary;
            idInfo = body.id_info;
        }

        // update kyc status as we recieve events
        if (aiPraiseEvents[eventType]) {
            const kycStatusNumber = aiPraiseEvents[eventType];
            await Users.updateOne({ _id: cRI }, { $set: { kycStatus: kycStatusNumber } });
            return res.status(200).json({
                status: 200,
                message: "Invalid aipraise event",
            });
        }

        const { verification_result: vR } = aiSummery;

        const ApprovedStatus = [AiPriseKycStatus.APPROVED];
        if (status === Status.COMPLETED && !ApprovedStatus.includes(vR)) {
            const messageId = vR === AiPriseKycStatus.REVIEW ? "kyc_decision_in_review" : "kyc_decision_rejected";
            const message = await translateWithLenguageSpecifiedV1(language)(messageId, { decisionType: vR });
            const aiPraise = {
                verificationSessionId: vSi,
                status: vR,
                message,
            };
            const payload = {
                kycStatus: 5,
                isVerified: false,
                kycAttempts: totalAttempts,
                aiPraise,
            };
            if (vR === AiPriseKycStatus.REVIEW) {
                payload.kycStatus = 3;
                await markWorkFlowInReview(message, userId, devices, language, payload);
            } else { await markWorkFlowAsFailled(message, userId, devices, language, payload); }
            return res.status(200).json({
                status: 200,
            });
        }

        const {
            id_type: idType,
            id_number: idNumber,
            birth_date: birthDate,
            gender,
            issue_country: country,
            issue_country_code: issueCountryCode,
            first_name: fName,
            last_name: lName,
        } = idInfo;

        let firstName;
        let lastName;
        if (!fName || !lName) {
            firstName = givenFirstName;
            lastName = givenLastName;
        } else {
            lastName = cleanNameString(lName);
            firstName = cleanNameString(fName);
        }
        // check for validations
        if (!idType || !idNumber || !birthDate || !issueCountryCode) {
            const messageId = "kyc_something_went_wrong";
            const message = await translateWithLenguageSpecifiedV1(language)(messageId);
            const aiPraise = {
                verificationSessionId: vSi,
                status: AiPriseKycStatus.DECLINED_BY_STABLE,
                message,
            };
            const payload = {
                kycStatus: 5,
                isVerified: false,
                kycAttempts: totalAttempts,
                aiPraise,
            };
            await markWorkFlowAsFailled(message, userId, devices, language, payload);
            return res.status(400).json({
                status: 400,
                message: "Kyc detials are missing",
            });
        }

        // check if user's age is > 18
        if (calculateAge(birthDate) < 18) {
            // return user_age_must_be_18_or_above
            const messageId = "user_age_must_be_18_or_above";
            const message = await translateWithLenguageSpecifiedV1(language)(messageId);
            const aiPraise = {
                verificationSessionId: vSi,
                status: AiPriseKycStatus.DECLINED_BY_STABLE,
                message,
            };
            const payload = {
                kycStatus: 5,
                isVerified: false,
                kycAttempts: totalAttempts,
                aiPraise,
            };
            await markWorkFlowAsFailled(message, userId, devices, language, payload);
            return res.status(200).json({
                status: 200,
            });
        }

        // check if user document number is already registered with us
        const queryisUserDocumentIdNumberAlreadyExists = { _id: { $not: { $eq: user._id } }, "kyc.documentIdNumber": { $regex: idNumber, $options: "i" } };
        const isDocumentNumberExists = await Users.findOne(queryisUserDocumentIdNumberAlreadyExists);
        if (isDocumentNumberExists) {
            const messageId = "kyc_rejected_user_document_number_already_exists";
            const message = await translateWithLenguageSpecifiedV1(language)(messageId);
            const aiPraise = {
                verificationSessionId: vSi,
                status: AiPriseKycStatus.DECLINED_BY_STABLE,
                message,
            };
            const payload = {
                kycStatus: 5,
                isVerified: false,
                kycAttempts: totalAttempts,
                aiPraise,
            };
            await markWorkFlowAsFailled(message, userId, devices, language, payload);
            return res.status(200).json({
                status: 200,
            });
        }

        const aiPraise = {
            verificationSessionId: vSi,
            status: vR,
        };

        // format the data before saving
        const userISO3CountryCode = getCountryISO3(issueCountryCode);
        const { d24DocumentType, pomeloDocumentType } = getD24AndPomeloDocumentType(userISO3CountryCode, idType);
        const kycDetails = {
            documentType: idType,
            documentIdNumber: idNumber,
            countryCode: userISO3CountryCode, // convert to 3digits recieving 2 digits
            d24DocumentType,
            d24CountryCode: issueCountryCode, // ISO-2 3166 format CO,MX
            pomeloDocumentType,
        };

        const userUpdateQuery = {
            $set: {
                kycStatus: 1,
                dateOfBirth: birthDate,
                kyc: kycDetails,
                aiPraise,
                firstName,
                lastName,
                isVerified: true,
                kycvfotu: true,
                kycAttempts: totalAttempts,
                kycVerifiedAt: moment().utc(),
            },
        };

        if (!user.gender) {
            userUpdateQuery.$set.gender = getUserGender(gender || "male");
        }

        const isUserUpdated = await Users.updateOne({ _id: userId }, userUpdateQuery);
        // user score updated
        const scoreData = {
            userId,
            code: ScoreKeys.KYC,
        };
        Event.emit(EventTypes.UpdateUserScore, scoreData);
        // update hubspot life cycle stage
        if (process.env.NODE_ENV === "production") HubspotEvents.emit(EventTypes.UpdateCustomerLifeCycleStage, { email: user.email, stageId: HubspotCustomerLifecycleStages.CUSTOMER });

        const message = await translateWithLenguageSpecifiedV1(language)("kyc_completed_message");
        const title = await translateWithLenguageSpecifiedV1(language)("kyc_completed");
        const emailSubject = await translateWithLenguageSpecifiedV1(language)("kyc_completed_email_subject");
        await sendNotificationToUserAboutHisWorkflow(devices, title, message);

        const emailTemplate = language === Lenguages.Spanish ? "OnboardingCompletedGreetWelcomeSpanish" : "OnboardingCompletedGreetWelcome";
        const emailPayload = {
            fullName: `${capitalizeName(user.firstName)} ${capitalizeName(user.lastName)}`,
        };
        await sendEmailOrMessageV3({ email: user.email, onEmail: true, emailSubject, templates: chooseEmailTemplateAndMessage(emailTemplate, false, emailPayload) });
        logger.info(`${user.email} has completed his KYC successfully.`);
        return res.status(200).json({ message: "Kyc completed successfully." });
    } catch (error) {
        next(error);
    }
    return true;
}
export default kycStatus;
