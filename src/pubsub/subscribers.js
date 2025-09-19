import { createClient } from "redis";
import logger from "../logger/index.js";
import KEYS from "../config/keys.js";
import { PubSubChannels } from "../constants/index.js";
import SocketHelper from "../config/sockerHelper.js";
import getFromCache from "../utils/cache/getFromCache.js";

const PusblisherRedisClient = createClient({
    password: KEYS.REDIS_CLOUD.PASSWORD,
    socket: {
        host: KEYS.REDIS_CLOUD.HOST,
        port: KEYS.REDIS_CLOUD.PORT,
        keepAlive: true,
    },
});

const SubscriberRedisClient = PusblisherRedisClient.duplicate(); // dublicating as both publishers and subscribers needs two different connections

// connecting both connections
await PusblisherRedisClient.connect();
await SubscriberRedisClient.connect();

// subscribing channels
await SubscriberRedisClient.subscribe(PubSubChannels.BalanceUpdate, async (payload, channel) => {
    logger.info(`${channel.toUpperCase()} Channel received :: Payload ${payload}`);

    const channelPayload = JSON.parse(payload);
    const { userEmail, ...restPayload } = channelPayload || {};

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
    SocketHelper.updateBalance(socketId, restPayload);
    logger.info(`Balance update sent to socket for ${userEmail}`);
    return true;
});

await SubscriberRedisClient.subscribe(PubSubChannels.Notifications, async (payload, channel) => {
    logger.info(`${channel.toUpperCase()} Channel revieved :: Payload ${payload}`);
    const channelPayload = JSON.parse(payload);

    const { serverUUID, payload: { userId, ...restPayload } } = channelPayload || {};
    logger.info(`Server UUID : ${KEYS.SERVER_UUID}`);
    // if (serverUUID !== KEYS.SERVER_UUID) {
    //     logger.warn("Returning as this payload is not for my server.");
    //     return false;
    // }

    const SocketId = await getFromCache(userId);
    logger.info(`SockedId from cache: ${SocketId}`);
    if (!SocketId) return false;
    SocketHelper.pushMessage(SocketId, restPayload);
    return true;
});
PusblisherRedisClient.on("error", (err) => logger.error(`Pusblisher :: error ${err}`));
SubscriberRedisClient.on("error", (err) => logger.error(`Subscriber :: error ${err}`));

PusblisherRedisClient.on("connect", () => {
    logger.info("Pusblishers redis Client connected...");
});

SubscriberRedisClient.on("connect", () => {
    logger.info("Subscribers redis Client connected...");
});

export {
    SubscriberRedisClient,
    PusblisherRedisClient,
};
