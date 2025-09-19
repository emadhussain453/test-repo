import redisClient from "../../config/redis.js";

const deleteFromCache = async (key) => {
    try {
        if (!key) return false;
        await redisClient.del(key);
        return true;
    } catch (error) {
        return true;
    }
};
export default deleteFromCache;
