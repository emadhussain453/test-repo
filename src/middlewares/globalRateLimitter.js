import redisClient from "../config/redis.js";
import { ExpirySeconds } from "../constants/index.js";

const GLOBAL_RATE_LIMIT = {
    time: ExpirySeconds.m1,
    limit: 50,
    blockDuration: ExpirySeconds.m15,
};

const globalRateLimiter = async (req, res, next) => {
    const { t: translate } = req;
    const userIpAddress = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip;
    const userTempDeviceId = req.headers["x-temp-id"];
    if (!userTempDeviceId || !userIpAddress) {
        return next();
    }
    const key = `RateLimiter:Global:${userIpAddress}-${userTempDeviceId}`;
    const blockUserKey = `UserBlock:Global:${key}`;

    try {
        // Check if the user is already blocked
        const isUserBlocked = await redisClient.ttl(blockUserKey); // -1 key with no expiry , -2 key doesnt exists
        const minutesToWait = Math.floor(isUserBlocked / 60);
        const isInMinutes = minutesToWait > 1;
        const time = isInMinutes ? `${minutesToWait} Minutes` : `${isUserBlocked} Seconds`;
        if (isUserBlocked > 0) {
            return res.status(429).json({
                name: "RateLimiterBlocked",
                status: 429,
                success: false,
                error: true,
                message: translate("rate_limitter_block_v1", { time }),
                results: {
                    unblockIn: isInMinutes ? `${minutesToWait} Minutes` : `${isUserBlocked} Seconds`,
                },
            });
        }

        // Increment the API usage count
        const totalCount = await redisClient.incr(key);
        if (totalCount === 1) {
            // Set expiry for the rate limit key
            await redisClient.expire(key, GLOBAL_RATE_LIMIT.time);
        }

        // Set rate limit headers
        res.set({
            "X-RateLimit-Limit": GLOBAL_RATE_LIMIT.limit,
            "X-RateLimit-Remaining": GLOBAL_RATE_LIMIT.limit - totalCount,
            "X-RateLimit-Reset": GLOBAL_RATE_LIMIT.time,
        });

        // If user exceeds the rate limit, block them
        if (totalCount > GLOBAL_RATE_LIMIT.limit) {
            await redisClient.setEx(blockUserKey, GLOBAL_RATE_LIMIT.blockDuration, "true");
            return res.status(429).json({
                name: "RateLimiterError",
                status: 429,
                success: false,
                error: true,
                message: translate("rate_limitter_block_v1", { time }),
            });
        }

        return next();
    } catch (error) {
        return next(error);
    }
};

export default globalRateLimiter;
