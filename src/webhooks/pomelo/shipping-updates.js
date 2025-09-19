import { NotificationPriority, POMELO_IP_ADDRESSES, PomeloWebhookStatus, PomeloWebhookStatusDetails, ShipmentStatus } from "../../constants/index.js";
import logger from "../../logger/index.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import PomeloUsers from "../../models/pomeloUser.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import hashResponseForPomelo from "../../utils/pomelo/hashResponseForPomelo.js";
import sendErrorResponse from "../../utils/pomelo/sendErrorResponse.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";

const shippingUpdates = async (req, res, next) => {
    try {
        if (!POMELO_IP_ADDRESSES.includes(req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "Invalid Ip address");

        const { body: { shipment_id: shipmentId, status } } = req;
        // find pomelo user
        const isPomeloUser = await PomeloUsers.findOne({ "cards.shipmentId": shipmentId }).populate({
            path: "userId",
            select: "isBlocked isVerified language devices email phoneNumber firstName userName",
        });
        if (!isPomeloUser) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "User not found.");
        }
        if (isPomeloUser.userId.isBlocked) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "User is blocked in stable");
        }
        if (!isPomeloUser.userId.isVerified) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "User is not verified.");
        }
        const { userId: { firstName, userName: name, language, email, devices } } = isPomeloUser;
        if (status === ShipmentStatus.DELIVERED) {
            const activateCardEmailSubject = await translateWithLenguageSpecifiedV1(language)("activate_card_email_subject");
            const activateCardEmailTemplate = await translateWithLenguageSpecifiedV1(language)("activate_card_email_template");
            const userName = name || firstName;
            await sendEmailOrMessageV3({
                email,
                onEmail: true,
                emailSubject: activateCardEmailSubject,
                templates: chooseEmailTemplateAndMessage(activateCardEmailTemplate, false, { userName }),
            });
            const title = language === "es" ? "Activar Tarjeta 🎉" : "Activate Card 🎉";
            const userActiveNotificationToken = activeNotificationTokenOfUser(devices);
            const pushNotificationPayload = {
                title,
                message: await translateWithLenguageSpecifiedV1(language)("activate_your_card"),
                tokens: userActiveNotificationToken,
            };
            await notificationsQueue.add("pushNotification", pushNotificationPayload, { priority: NotificationPriority.THREE });
        }
        return hashResponseForPomelo(req, res, false, 200);
    } catch (error) {
        return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, error.message);
    }
};

export default shippingUpdates;
