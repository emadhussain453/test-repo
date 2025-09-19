import logger from "../../logger/index.js";

function kushkiWebhookCompleted(job, result) {
    logger.info({ result });
    logger.info(`kushki Webhook Transaction has been completed.`);
    job.remove();
}
export default kushkiWebhookCompleted;
