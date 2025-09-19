import redisClient from "../config/redis.js";
import { ExpirySeconds } from "../constants/index.js";
import RateLimitterRules from "../constants/rateLimitterRules.js";

const userBaseRateLimitter = async (req, res, next) => {
    const { translate, query } = req;
    const pathname = req.originalUrl?.split("?")[0];
    const rateLimitRules = RateLimitterRules[pathname];
    if (!rateLimitRules || process.env.NODE_ENV !== "production") {
        return next();
    }
    const { endpoint, rateLimit: { time, limit, blockDuration = ExpirySeconds.m15 }, checkQuery = false } = rateLimitRules;
    const userEmail = req.user?.email;
    let key = `RateLimitter:${userEmail}:${endpoint}`;
    if (checkQuery && query && Object.keys(query).length > 0) {
        const queryKey = JSON.stringify(query).toLowerCase();
        key = `${key}:${queryKey}`;
    }
    const blockUserKey = `Userblock:${key}`;

    try {
        // check if user is already blocked
        const isUserBlocked = await redisClient.ttl(blockUserKey); // -1 key with no expiry , -2 key doesnt exists
        let minutesToWait = Math.floor(isUserBlocked / 60);
        let isInMinutes = minutesToWait > 1 && true;
        let timeToBlock = isInMinutes ? `${minutesToWait} Minutes` : `${isUserBlocked} Seconds`;
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

        // if api is passcode then block user
        // if (endpoint === "verifyPasscode" && totalCount > limit) {
        //     const { _id } = req.user;
        //     const updatePayload = { status: true, ...SoftBlockTypes.PASSCODE };
        //     await Users.updateOne({ _id }, { $set: { softBlock: updatePayload } });
        // }

        // if ratelimitter quota is used
        if (totalCount > limit) {
            minutesToWait = Math.floor(blockDuration / 60);
            isInMinutes = minutesToWait > 1 && true;
            timeToBlock = isInMinutes ? `${minutesToWait} Minutes` : `${isUserBlocked} Seconds`;
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
        return next(error);
    }
};

export default userBaseRateLimitter;
