import keys from "../config/keys.js";
import SocketHelper from "../config/sockerHelper.js";
import { PubSubChannels } from "../constants/index.js";
import logger from "../logger/index.js";
import getFromCache from "../utils/cache/getFromCache.js";
import { PusblisherRedisClient } from "./subscribers.js";

// publishers
async function triggerBalanceUpdateEvent(userEmail, payload) {
    if (!userEmail) {
        logger.warn("UserEmail not found in payload");
        return false;
    }

    // Construct Redis key for socketId
    const redisKey = `socket:user:${userEmail}`;
    const socketId = await getFromCache(redisKey);

    logger.info(`SocketId fetched from cache for ${userEmail}: ${socketId}`);

    if (!socketId) {
        logger.warn(`No SocketId found for userEmail: ${userEmail}`);
        return false;
    }

    // Emit balance update to the socket
    SocketHelper.updateBalance(socketId, payload);
    logger.info(`Balance update sent to socket for ${userEmail}`);
    return true;
}

async function triggerNotificationEvent(userId, payload) {
    const channelPayload = {
        serverUUID: keys.SERVER_UUID,
        payload: {
            userId,
            ...payload,
        },
    };

    const stringifyChannelPayload = JSON.stringify(channelPayload);
    await PusblisherRedisClient.publish(PubSubChannels.Notifications, stringifyChannelPayload);
    logger.info("message has been published to the notifications channel");
}

export {
    triggerBalanceUpdateEvent,
    triggerNotificationEvent,
};
