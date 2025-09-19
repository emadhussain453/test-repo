import logger from "../../logger/index.js";

function d24WebhookFailed(job, result) {
    logger.info(`Job retry attempt :: ${job.attemptsMade}`);
    if (job.attemptsMade >= 3) {
        // send notification to admin
        // write log in log file

        // means update the transaction status to failed on the last attempt
        if (job.attemptsMade === 3) {
            logger.info({ result });
            logger.error(`Job Failed => ${job.name} :: ${job.id} got failed`);
            logger.error(`Job Failed => ${job.name} :: ${job.id} is still in the queue, please look on this job.`);
        }
        // job.remove(); // will remove the job from queue
    }
}
export default d24WebhookFailed;
