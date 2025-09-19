import redisClient from "../config/redis.js";
import { ExpirySeconds } from "../constants/index.js";
import RateLimitterRules from "../constants/rateLimitterRules.js";

const ipBaseRateLimitter = async (req, res, next) => {
    try {
        const { t: translate } = req;
        const userIpAddress = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip;
        const userTempDeviceId = req.headers["x-temp-id"];
        if (!userTempDeviceId || !userIpAddress || process.env.NODE_ENV !== "production") {
            return next();
        }

        const pathname = req.originalUrl?.split("?")[0];
        const rateLimitRules = RateLimitterRules[pathname];
        if (!rateLimitRules) {
            return next();
        }
        const { endpoint, rateLimit: { time, limit, blockDuration = ExpirySeconds.m15 } } = rateLimitRules;

        const key = `RateLimitter:${userIpAddress}-${userTempDeviceId}:${endpoint}`;
        const blockUserKey = `UserIpblock:${key}`;

        const isUserBlocked = await redisClient.ttl(blockUserKey); // -1 key with no expiry , -2 key doesnt exists
        const minutesToWait = Math.floor(isUserBlocked / 60);
        const isInMinutes = minutesToWait > 1 && true;
        const timeToBlock = isInMinutes ? `${minutesToWait} Minutes` : `${isUserBlocked} Seconds`;
        if (isUserBlocked > 0) {
            return res.status(429).json({
                name: "RateLimiterBlocked",
                status: 429,
                success: false,
                error: true,
                message: translate(`rate_limitter_block_v1`, { time: timeToBlock }),
                results: {
                    unblockIn: isInMinutes ? `${minutesToWait} Minutes` : `${isUserBlocked} Seconds`,
                },
            });
        }

        // increament the usage of api calls
        const totalCount = await redisClient.incr(key);
        if (totalCount === 1) {
            // set expiry of that key
            await redisClient.expire(key, time);
        }

        // set ratelimitter headers
        res.set({
            "X-RateLimit-Limit": limit,
            "X-RateLimit-Remaining": limit - totalCount,
            "X-RateLimit-Reset": time,
        });

        // if ratelimitter quota is used
        if (totalCount > limit) {
            await redisClient.setEx(blockUserKey, blockDuration, "true");
            return res.status(429).json({
                name: "RateLimiterError",
                status: 429,
                success: false,
                error: true,
                message: translate(`rate_limitter_block_v1`, { time: timeToBlock }),
            });
        }
        return next();
    } catch (error) {
        throw new Error(error.message);
    }
};

export default ipBaseRateLimitter;
