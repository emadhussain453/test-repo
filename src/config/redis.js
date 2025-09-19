import { createClient } from "redis";
import logger from "../logger/index.js";
import KEYS from "./keys.js";

const redisClient = createClient({
    password: KEYS.REDIS_CLOUD.PASSWORD,
    socket: {
        host: KEYS.REDIS_CLOUD.HOST,
        port: KEYS.REDIS_CLOUD.PORT,
        keepAlive: true,
        // reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
    },
    // retry_strategy: (options) => undefined, // purpose of killing the client when the connection is lost
});

redisClient.on("error", (err) => {
    logger.warn(`Redis client error :: ${err.message}`);
});

redisClient.on("connect", () => {
    logger.info("Redis client connected...");
});

redisClient.on("reconnecting", () => {
    logger.warn("Redis client re-connecting...");
});
redisClient.on("ready", () => {
    logger.info("Redis client is ready...");
});

await redisClient.connect();

export default redisClient;
