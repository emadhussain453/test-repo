import Queue from "bull";
import { allNotificationCompleted, allNotificationFailed } from "./workers/allNotificationhandler.js";
import { smsProcessor, emailProcessor, pushNotificationProcessor } from "./workers/processors.js";
import { RedisConnectionObject } from "../constants/index.js";

const notificationsQueue = new Queue("Notifications", {
    redis: RedisConnectionObject,
    // concurrency: 10, // number of jobs to process in parallel
    // fifo: true, // first in first out
    settings: {
        // lockDuration: 10000, // used to prevent multiple workers from processing the same job at the same time
        // stalledInterval: 5000, // used to detect and automatically fail jobs that have been stalled. This time is used to check the progress of the job and see if it is making any progress. If no progress is made within the specified interval, the job is considered as stalled.
        // maxStalledCount: 1, // used to limit the amount of times a stalled job will be re-processed.
        // guardInterval: 5000, // used to check for stalled jobs on a per-queue basis instead of every stalledInterval milliseconds.
        // process: "cluster", // number of jobs to process in parallel
    },
    limiter: {
        max: 1000, // maximum number of jobs that can be processed in a given duration
        duration: 5000, // duration in milliseconds
    },
    defaultJobOptions: {
        removeOnComplete: true, // remove the job from the queue when it has completed
        removeOnFail: true, // remove the job from the queue when it has failed
        attempts: 3, // number of attempts to retry the job
        backoff: {
            type: "fixed", // type of backoff, fixed or exponential
            delay: 5000, // delay in milliseconds
        },
        // delay: 10000, // delay in milliseconds
    },
});

// worker
notificationsQueue.process("sms", smsProcessor);
notificationsQueue.process("email", emailProcessor);
notificationsQueue.process("pushNotification", pushNotificationProcessor);

// queue events
notificationsQueue.on("completed", allNotificationCompleted);
notificationsQueue.on("failed", allNotificationFailed);

export default notificationsQueue;
