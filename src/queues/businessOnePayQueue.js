import Queue from "bull";
import { BusinessRedisConnectionObject } from "../constants/index.js";

const businessOnepayWebhooksQueue = new Queue("onepay Webhooks", {
    redis: BusinessRedisConnectionObject,
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

export default businessOnepayWebhooksQueue;
