import { ApiError } from "../utils/ApiError.js";
import validateJwtToken from "../utils/validateJwtToken.js";

const generalAuthMiddleware = (secret, callback) => {
    const authHandler = (req, res, next) => {
        // get bearer token from header
        try {
            const { t: translate } = req;
            const token = req.headers.authorization;
            if (!token) {
                throw new ApiError("Access denied", 401, translate("no_token_provided"));
            }

            const getToken = validateJwtToken(token, secret);
            if (!getToken.token && getToken?.message) {
                const { key } = getToken;
                throw new ApiError("session_expired", 401, translate(key));
            }
            req.jwtPayload = getToken.jwtPayload;
            return next();
        } catch (error) {
            return next(error);
        }
    };
    return authHandler;
};

export default generalAuthMiddleware;
