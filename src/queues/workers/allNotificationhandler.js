import logger from "../../logger/index.js";

function allNotificationCompleted(job, result) {
    // send email to user
    logger.info(`${result.jobType} Notification Job Completed ::  Message ${JSON.stringify(result?.message)}`);
    job.remove();
}

function allNotificationFailed(job, err) {
    logger.error(`Notification Job Failed :: Message ${err.message} Attempts : ${job.attemptsMade}`);
    if (job.attemptsMade >= 3) {
        // send notification to admin
        // write log in log file
        logger.error(`Notification Job Failed :: Job removed from queue.`);
        job.remove(); // will remove the job from queue
    }
}

export {
    allNotificationCompleted,
    allNotificationFailed,
};
