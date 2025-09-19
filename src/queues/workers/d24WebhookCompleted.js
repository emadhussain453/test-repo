import logger from "../../logger/index.js";

function d24WebhookCompleted(job, result) {
    // send email to user
    logger.info({ result });
    logger.info(`D24 Webhook Transaction has been completed.`);
    job.remove();
}
export default d24WebhookCompleted;
