/* eslint-disable require-atomic-updates */
import { ApiError } from "../utils/ApiError.js";
import appVersionalidateToken from "../utils/appVersionValidateToken.js";

const appVersionMiddleware = (req, res, next) => {
    // get bearer token from header
    try {
        const { t: translate } = req;
        const token = req.headers.authorization;
        if (!token) {
            throw new ApiError("Access denied", 401, translate("no_token_provided"));
        }

        const getToken = appVersionalidateToken(token);
        if (!getToken.token && getToken?.message) {
            const errorKey = getToken?.message.split(" ")[0];
            if (errorKey === "invalid") throw new ApiError("session_expired", 401, translate("invalid_token"));
            if (errorKey === "jwt") throw new ApiError("session_expired", 401, translate("jwt_expire"));
            throw new ApiError("Access denied", 401, translate("something_went_wrong"));
        }
        next();
    } catch (error) {
        next(error);
    }
};

export default appVersionMiddleware;
