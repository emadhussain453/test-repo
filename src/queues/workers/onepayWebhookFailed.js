import logger from "../../logger/index.js";

function onepayWebhookFailed(job, result) {
    logger.info(`Job retry attempt :: ${job.attemptsMade}`);

    if (job.failedReason === "Transaction not found in user") {
        logger.error("job remove user");
        job.remove();
        return;
    }

    if (job.attemptsMade >= 3) {
        if (job.attemptsMade === 3) {
            logger.info({ result });
            logger.error(`Job Failed => ${job.name} :: ${job.id} got failed`);
            logger.error(`Job Failed => ${job.name} :: ${job.id} is still in the queue, please look on this job.`);
        }
    }
}

export default onepayWebhookFailed;
