import Queue from "bull";
import { RedisConnectionObject } from "../constants/index.js";
import kushkiPaymentLinkWebHookHandler from "../webhooks/kushki/paymentLinkWebhookController.js";
import kushkiWebhookCompleted from "./workers/kushkiWebhookComplete.js";
import kushkiWebhookFailed from "./workers/kushkiFailedWebhook.js";

const kushkiWebhookQueue = new Queue("stable kushki Webhooks", {
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
kushkiWebhookQueue.process("stable-backend-kushki-payment-link", kushkiPaymentLinkWebHookHandler);

kushkiWebhookQueue.on("completed", kushkiWebhookCompleted);
kushkiWebhookQueue.on("failed", kushkiWebhookFailed);

export default kushkiWebhookQueue;
