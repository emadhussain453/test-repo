/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
import ENV from "../../config/keys.js";
import { KushkiWebhookEvents, OnePayPaymentEvents, Status } from "../../constants/index.js";
import businessKushkiWebhooksQueue from "../../queues/businessKushkiWebhookQueue.js";
import businessOnepayWebhooksQueue from "../../queues/businessOnePayQueue.js";
import kushkiWebhookQueue from "../../queues/kushkiWebhookQueue.js";
import { ApiError } from "../../utils/ApiError.js";

async function kushkiWebHookPaymentLink(req, res, next) {
    try {
        const { body: { smartLink, amount, status: event, transactionReference: depositId, bankName, contactDetails, metadata } } = req;

          const finalSmartLink = smartLink || (metadata?.smartlinkId);
          const finalName = contactDetails?.name || metadata?.name;
          const finalEmail = contactDetails?.email || req.body.email;

        if (!Object.values(KushkiWebhookEvents).includes(event)) return res.status(200).json({ message: "message recieved" });

        await kushkiWebhookQueue.add("stable-backend-kushki-payment-link", { smartLinkId: finalSmartLink, status: event, transactionReference: depositId, bankName, name: finalName, email: finalEmail });
        await businessKushkiWebhooksQueue.add("stable-business-kushki-payment-link", { smartLinkId: finalSmartLink, status: event, amount: amount?.subtotalIva0, transactionReference: depositId, bankName, name: finalName, email: finalEmail });

        return res.status(200).json({ message: "Webhook received and queued for processing" });
    } catch (error) {
        next(error);
    }
    return kushkiWebHookPaymentLink;
}
export default kushkiWebHookPaymentLink;
