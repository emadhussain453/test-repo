import logger from "../../logger/index.js";

function d24WebhookProcessor(job, done) {
    try {
        // throw new Error("error")
        // The value returned by your process function will be stored in the jobs object and can be accessed later on, for example in a listener for the completed event.
        const results = []; // await sendSms(job.data.phoneNumber, job.data.message);
        if (results instanceof Error) {
            throw new Error(results.message);
        }
        const response = {
            jobType: "Sms",
            message: results[0]?.body,
        };
        done(null, response);
        return results;
    } catch (error) {
        logger.error(`Sms-processor : ${error.message}`);
        done(error, null);
    }
    return false;
}
export default d24WebhookProcessor;
