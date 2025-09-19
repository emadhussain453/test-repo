import sendSms from "../../config/sendSms.js";
import sendEmailWithSES from "../../config/sesEmail.js";
import logger from "../../logger/index.js";
import sendPushNotification from "../../utils/Notifications/sendPushNotifications.js";

async function emailProcessor(job, done) {
    try {
        await sendEmailWithSES(job.data.email, job.data.subject, job.data.message);
        const response = {
            jobType: "Email",
            message: "Email has been sent successfully",
        };
        done(null, response);
    } catch (error) {
        logger.error(`Email-notification-processor :${error}`);
        done(error, null);
    }
}

async function pushNotificationProcessor(job, done) {
    try {
        // The value returned by your process function will be stored in the jobs object and can be accessed later on, for example in a listener for the completed event.
        const results = await sendPushNotification(job.data.title, job.data.message, job.data.tokens, job.data?.additionalDetails);
        if (results instanceof Error) {
            throw new Error(results.message);
        }
        const response = {
            jobType: "Push",
            ...results,
        };
        done(null, response);
    } catch (error) {
        logger.error(`Push-notification-processor :${error.message}`);
        done(error, null);
    }
}

async function smsProcessor(job, done) {
    try {
        // The value returned by your process function will be stored in the jobs object and can be accessed later on, for example in a listener for the completed event.
        const results = await sendSms(job.data.phoneNumber, job.data.message);
        if (results instanceof Error) {
            throw new Error(results.message);
        }
        const response = {
            jobType: "Sms",
            message: results.MessageId,
        };
        done(null, response);
        return results;
    } catch (error) {
        logger.error(`Sms-processor : ${error.message}`);
        done(error, null);
    }
    return false;
}

export {
    emailProcessor,
    smsProcessor,
    pushNotificationProcessor,
};
