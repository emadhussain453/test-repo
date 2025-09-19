import logger from "../../logger/index.js";

function onepayWebhookCompleted(job, result) {
    logger.info({ result });
    logger.info(`OnePay Webhook Transaction has been completed.`);
    job.remove();
}
export default onepayWebhookCompleted;
