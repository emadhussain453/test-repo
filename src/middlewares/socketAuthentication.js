/* eslint-disable require-atomic-updates */
import { ExpirySeconds } from "../constants/index.js";
import logger from "../logger/index.js";
import Users from "../models/users.js";
import { ApiError } from "../utils/ApiError.js";
import setToCache from "../utils/cache/setToCache.js";
import validateToken from "../utils/validateToken.js";

const socketAuthMiddleware = async (socket, next) => {
    // get bearer token from header
    try {
        const token = socket.handshake.headers.authorization;
        if (!token) {
            throw new ApiError("Access denied", 401, "no_token_provided");
        }
        const getToken = validateToken(token);
        if (!getToken.token && getToken?.message) {
            const errorKey = getToken?.message.split(" ")[0];
            if (errorKey === "invalid") throw new ApiError("session_expired", 401, "invalid_token");
            if (errorKey === "jwt") throw new ApiError("session_expired", 401, "jwt_expire");
            throw new ApiError("Access denied", 401, "something_went_wrong");
        }
        let user = null;
        if (getToken.token) {
            user = await Users.findOne({ _id: getToken.user.userId }).select("email isDeleted isBlocked tokenVersion");
            if (!user) {
                throw new ApiError("Access denied", 401, "unauthorized_user", true);
            }
        }
        if (user?.tokenVersion !== getToken.user.tokenVersion) {
            throw new ApiError("session_expired", 401, "outdated_jwt", true);
        }
        if (user?.isBlocked ?? false) {
            throw new ApiError("Access denied", 401, "account_blocked", true);
        }
        if (user?.isDeleted ?? false) {
            throw new ApiError("Access denied", 401, "account_deleted", true);
        }

        const userEmail = user.email;
        const redisKey = `socket:user:${userEmail}`;
        const redisKeySocketUserData = `socket:user:${userEmail}:data`;

        // save user socketId in redis
        await setToCache(redisKey, socket.id, ExpirySeconds.m10);

        // save user basic data in redis
        const userDataInRedis = {
            _id: user._id,
            email: user.email,
        };
        await setToCache(redisKeySocketUserData, userDataInRedis, ExpirySeconds.m10);
        // eslint-disable-next-line no-param-reassign
        socket.user = userDataInRedis;

        logger.info(`Email :: ${userEmail} Socket User Connected :: ${(socket.id)}`);
        next();
    } catch (error) {
        next(error);
    }
};

export default socketAuthMiddleware;
