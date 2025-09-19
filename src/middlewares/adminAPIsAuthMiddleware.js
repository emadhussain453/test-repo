import keys from "../config/keys.js";
import { ApiError } from "../utils/ApiError.js";
import validateToken from "../utils/validateToken.js";

const adminAPIsAuthMiddleware = (req, res, next) => {
    try {
        const { t: translate } = req;
        const token = req.headers.authorization;
        if (!token) {
            throw new ApiError("Access denied", 401, translate("no_token_provided"));
        }

        const getToken = validateToken(token, keys.JWT.ADMIN_SECRET_KEY);
        if (!getToken.token && getToken?.message) {
            const [errorKey, errorKey2] = getToken?.message.split(" ") || [];
            if (errorKey === "invalid" || errorKey2 === "malformed") throw new ApiError("session_expired", 401, translate("invalid_token"));
            if (errorKey === "jwt") throw new ApiError("session_expired", 401, translate("jwt_expire"));
            throw new ApiError("Access denied", 401, translate("something_went_wrong"));
        }

        if (!getToken.token) {
            throw new ApiError(translate("Access denied"), 401, translate("unauthorized_user"), true);
        }

        next();
    } catch (error) {
        next(error);
    }
};

export default adminAPIsAuthMiddleware;
