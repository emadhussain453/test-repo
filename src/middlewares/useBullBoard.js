import { ExpressAdapter } from "@bull-board/express";
import { BullAdapter } from "@bull-board/api/bullAdapter.js";
import { createBullBoard } from "@bull-board/api";

import notificationsQueue from "../queues/notificationQueue.js";
import d24WebhooksQueue from "../queues/d24WebhooksQueue.js";
import onepayWebhooksQueue from "../queues/onePayWebhookQueue.js";

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [
        new BullAdapter(notificationsQueue, { allowRetries: true, readOnlyMode: true }),
        new BullAdapter(d24WebhooksQueue, { allowRetries: true, readOnlyMode: true }),
        new BullAdapter(onepayWebhooksQueue, { allowRetries: true, readOnlyMode: true }),
    ],
    serverAdapter,
    uiConfig: {
        boardTitle: "Stable Queues",
    },
});

export default serverAdapter;
