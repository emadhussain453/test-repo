/* eslint-disable camelcase */
import ENV from "../../config/keys.js";
import sendEmailWithSES from "../../config/sesEmail.js";
import { OnePayPaymentEvents, Status } from "../../constants/index.js";
import businessOnepayWebhooksQueue from "../../queues/businessOnePayQueue.js";
import onepayWebhooksQueue from "../../queues/onePayWebhookQueue.js";
import { ApiError } from "../../utils/ApiError.js";

async function onePayWebHookCashin(req, res, next) {
    try {
        const { body: { event: { type }, payment: { id, status } } } = req;
        const webToken = req.headers["x-webhook-token"];
        if (webToken !== ENV.ONEPAY.WEB_TOKEN) console.log(`web token not match ::  ${webToken}`);
        if (process.env.NODE_ENV === "production" && webToken !== ENV.ONEPAY.WEB_TOKEN) throw new ApiError("Access denied", 400, "Bad Auth", true);
        if (!Object.values(OnePayPaymentEvents).includes(type)) {
            return res.status(200).json({ message: "message recieved" });
        }

        if (!Object.values(Status).includes(status.toUpperCase())) {
            throw new ApiError("Invalid Amount", 400, "Status is not valid", true);
        }
        await onepayWebhooksQueue.add("stable-backend-onepay-cashin", { depositId: id, status, type });
        await businessOnepayWebhooksQueue.add("stable-business-onepay-cashin", { depositId: id, status, type });

        console.log(`depositId: ${id}`);
        return res.status(200).json({ message: "Webhook received and queued for processing" });
    } catch (error) {
        next(error);
    }
    return onePayWebHookCashin;
}
export default onePayWebHookCashin;
