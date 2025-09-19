/* eslint-disable consistent-return */
import { Expo } from "expo-server-sdk";
import logger from "../../logger/index.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import { Lenguages } from "../../constants/index.js";

async function sendPushNotification(title = "test", message = "test notification", tokens = [], additionalDetails = { silent: false }) {
    if (tokens.length <= 0) return { message: await translateWithLenguageSpecifiedV1(Lenguages.English)("notification_token_missing"), spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("notification_token_missing") };
    const expo = new Expo({ useFcmV1: true });
    const somePushTokens = tokens;
    const validTokens = [];

    somePushTokens.forEach((pushToken) => {
        if (!Expo.isExpoPushToken(pushToken)) {
            logger.error(`Push token ${pushToken} is not a valid Expo push token`);
        } else {
            validTokens.push(pushToken);
        }
    });

    const messages = {
        to: validTokens,
        title,
        body: message,
        sound: "default",
        ttl: 3600 * 24 * 7,
        priority: "high",
        data: { refreshUser: true, ...additionalDetails, uuid: new Date().getTime() },
    };
    const chunks = expo.chunkPushNotifications([messages]);

    const tickets = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            logger.error(`PushNotificationSentFailed :: ${error.message}`);
        }
    }
    return { message };
}

export default sendPushNotification;
