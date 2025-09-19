import Queue from "bull";
import { RedisConnectionObject } from "../constants/index.js";
import d24WebhookCompleted from "./workers/d24WebhookCompleted.js";
import d24WebhookFailed from "./workers/d24WebhookFailed.js";
import { d24CashinWebhookHandler, d24CashoutWebhookHandler } from "../webhooks/d24/index.js";
import d24WebhookStalledJobs from "./workers/d24WebhookStalledJobs.js";

const d24WebhooksQueue = new Queue("D24 Webhooks", {
    redis: RedisConnectionObject,
    fifo: true,
    settings: {
        lockDuration: 10000, // used to prevent multiple workers from processing the same job at the same time
    },
    limiter: { // maximun 10 jobs in 1sec
        max: 1000, // maximum number of jobs that can be processed in a given duration
        duration: 5000, // duration in milliseconds
    },
    defaultJobOptions: {
        removeOnComplete: true, // remove the job from the queue when it has completed
        removeOnFail: false, // remove the job from the queue when it has failed
        attempts: 3, // number of attempts to retry the job
        backoff: {
            type: "fixed", // type of backoff, fixed or exponential
            delay: 5000, // delay in milliseconds
        },
    },
});

// workers
d24WebhooksQueue.process("cashin-webhook", d24CashinWebhookHandler);
d24WebhooksQueue.process("cashout-webhook", d24CashoutWebhookHandler);
// queue events
d24WebhooksQueue.on("stalled", d24WebhookStalledJobs);
d24WebhooksQueue.on("completed", d24WebhookCompleted);
d24WebhooksQueue.on("failed", d24WebhookFailed);

export default d24WebhooksQueue;
