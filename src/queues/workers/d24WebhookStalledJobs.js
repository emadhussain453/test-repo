import logger from "../../logger/index.js";

function d24WebhookStalledJobs(job, result) {
    logger.warn(job);
    logger.warn(`Job => ${job.name} :: ${job.id} got stalled attempt is :: ${job.opts.attemptsMade}`);
    logger.warn(`Job => ${job.name} :: ${job.id} is still in the queue, please look on this job.`);
    // job.remove();
}
export default d24WebhookStalledJobs;
