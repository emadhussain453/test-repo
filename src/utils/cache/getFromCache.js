import redisClient from "../../config/redis.js";
import logger from "../../logger/index.js";

async function getFromCache(key) {
    try {
        const isExists = await redisClient.get(key);
        if (!isExists) return false;
        return JSON.parse(isExists);
    } catch (error) {
        throw new Error(error.message);
    }
}

export default getFromCache;
