import logger from "../../logger/index.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import Users from "../../models/users.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import getFromCache from "../../utils/cache/getFromCache.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import getMessage from "../../utils/hubspot/getMessages.js";
import getUserFromHubspot from "../../utils/hubspot/getUser.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import chatWithAi from "../../utils/ai/chat.js";
import callApi from "../../utils/callApi.js";
import ENV from "../../config/keys.js";
import { NotificationPriority } from "../../constants/index.js";
import capitalizeName from "../../utils/capitalizeName.js";

async function hubspotMessages(req, res, next) {
    try {
        const { body } = req;
        const { messageId, objectId } = body?.[0] ?? {};
        if (!messageId && !objectId) {
            return res.status(200).json({ status: true });
        }
        const message = await getMessage(objectId, messageId);

        // eslint-disable-next-line prefer-const
        const { recipients, text } = message;
        const { actorId } = recipients?.[0] ?? {};

        if (!actorId) {
            const params = objectId;
            const isChatAssigned = await callApi.hubspotMsg("hubspot", "getconversations", "get", false, params, ENV.HUPSPOT.MSG_KEY);

            if (!isChatAssigned.success) {
                return res.status(200).json({ status: true });
            }

            if (!(isChatAssigned.results.assignedTo)) {
                const resAi = await chatWithAi(text);
                const payload = {
                    type: "MESSAGE",
                    text: resAi.message,
                    senderActorId: "A-60250932",
                    channelId: "1000",
                    channelAccountId: "299709165",

                };
                const param2 = `${objectId}/messages`;
                const sendReply = await callApi.hubspotMsg("hubspot", "getconversations", "post", payload, param2, ENV.HUPSPOT.MSG_KEY);
            }
            return res.status(200).json({ status: true });
        }

        let getUser = null;
        try {
            getUser = await getUserFromHubspot(actorId);
        } catch (error) {
            logger.error("Error in getting user from hubspot", error.message);
            return res.status(200).json({ status: true });
        }

        if (!getUser) {
            return res.status(200).json({ status: true });
        }
        const { email } = getUser;

        if (!email) {
            return res.status(200).json({ status: true });
        }

        // findUserFromRedis

        const redisKey = `socket:user:${email}:chatting`;
        const arrayOfPromises = [getFromCache(redisKey), Users.findOne({ email })];
        const [userDatainRedis, user] = await Promise.all(arrayOfPromises);
        if (userDatainRedis) {
            return res.status(200).json({ status: true });
        }

        if (!user) {
            return res.status(200).json({ status: true });
        }

        // send chat message from support
        const title = "Support message";
        const userActiveNotificationToken = activeNotificationTokenOfUser(user.devices);
        const additionalDetails = {
            notificationType: "hubspotChat",
        };
        await notificationsQueue.add("pushNotification", {
            title,
            message: `${text.substring(0, 25)} ${text.length > 25 ? "..." : ""}`,
            tokens: userActiveNotificationToken,
            additionalDetails,
        }, { priority: NotificationPriority.TWO });

        const supportEmailSubject = await translateWithLenguageSpecifiedV1(user?.language)("support_email_subject");
        const supportEmailTemplate = await translateWithLenguageSpecifiedV1(user?.language)("support_email_template");
        const fullName = `${capitalizeName(user.firstName)} ${capitalizeName(user.lastName)}`;
        await sendEmailOrMessageV3({ email, onEmail: true, emailSubject: supportEmailSubject, templates: chooseEmailTemplateAndMessage(supportEmailTemplate, false, { message: text, fullName }) });

        return res.status(200).json({ status: true });
    } catch (error) {
        next(error);
    }
    return true;
}
export default hubspotMessages;
