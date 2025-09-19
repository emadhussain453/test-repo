import redisClient from "../../config/redis.js";
import { ExpirySeconds } from "../../constants/index.js";

async function setToCache(key, featureStatus, expiry = ExpirySeconds.m15) {
    try {
        const value = JSON.stringify(featureStatus);
        const isExists = await redisClient.setEx(key, expiry, value);
        return isExists;
    } catch (error) {
        throw new Error(error.message);
    }
}
export default setToCache;
