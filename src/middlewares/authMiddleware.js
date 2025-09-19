/* eslint-disable require-atomic-updates */
import { ApiError } from "../utils/ApiError.js";
import validateToken from "../utils/validateToken.js";

const authMiddleware = (model) => {
    const authHandler = async (req, res, next) => {
        // get bearer token from header
        try {
            const { t: translate } = req;
            const token = req.headers.authorization;
            if (!token) {
                throw new ApiError("Access denied", 401, translate("no_token_provided"));
            }

            const getToken = validateToken(token);
            if (!getToken.token && getToken?.message) {
                const [errorKey, errorKey2] = getToken?.message.split(" ") || [];
                if (errorKey === "invalid" || errorKey2 === "malformed") throw new ApiError("session_expired", 401, translate("invalid_token"));
                if (errorKey === "jwt") throw new ApiError("session_expired", 401, translate("jwt_expire"));
                throw new ApiError("Access denied", 401, translate("something_went_wrong"));
            }

            let user = null;
            if (getToken.token) {
                user = await model.findOne({ _id: getToken.user.userId }).select(" -__v -createdAt -updatedAt").populate({ path: "userBalance", select: "userId balance" });
                if (!user) {
                    throw new ApiError(translate("Access denied"), 401, translate("unauthorized_user"), true);
                }
                if (!user.userBalance) {
                    throw new ApiError(translate("Access denied"), 401, translate("user_balance_not_found"), true);
                }
            }
            if (user?.tokenVersion !== getToken.user.tokenVersion && process.env.NODE_ENV !== "local") {
                throw new ApiError("session_expired", 401, translate("outdated_jwt"), true);
            }
            if (user?.isBlocked ?? false) {
                throw new ApiError(translate("Access denied"), 401, translate("account_blocked"), true);
            }
            if (user?.isDeleted ?? false) {
                throw new ApiError(translate("Access denied"), 401, translate("account_deleted"), true);
            }

            req.user = user;
            req.userDeviceId = getToken.user.deviceId;
            req.translate = req.t;
            next();
        } catch (error) {
            next(error);
        }
    };
    return authHandler;
};

export default authMiddleware;
