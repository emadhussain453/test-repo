import Users from "../../models/users.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import validateToken from "../../utils/validateToken.js";
import ENV from "../../config/keys.js";
import signJwtToken from "../../utils/signJWT.js";

const RefreshToken = async (req, res, next) => {
    try {
        const { t: translate } = req;
        const incomingRefreshToken = req.headers.authorization;
        if (!incomingRefreshToken) {
            throw new ApiError("Access denied", 401, translate("no_token_provided"));
        }
        const getToken = validateToken(incomingRefreshToken, ENV.JWT.REFRESH_TOKEN_SECRET);
        if (!getToken.token && getToken?.message) {
            const [errorKey, errorKey2] = getToken?.message.split(" ") || [];
            if (errorKey === "invalid" || errorKey2 === "malformed") throw new ApiError("session_expired", 401, translate("invalid_refresh_token"));
            if (errorKey === "jwt") throw new ApiError("session_expired", 401, translate("jwt_expire"));
            throw new ApiError("Access denied", 401, translate("something_went_wrong"));
        }
        let user = null;
        if (getToken.token) {
            user = await Users.findOne({ _id: getToken.user.userId }).select(" -__v -createdAt -updatedAt");
            if (!user) {
                throw new ApiError(translate("Access denied"), 401, translate("unauthorized_user"), true);
            }
        }
        const bearer = incomingRefreshToken.split(" ");

        const [, bearerToken] = bearer;
        if (bearerToken !== user.refreshToken) throw new ApiError(translate("Access denied"), 401, translate("old_refresh_token"), true);
        const tokenVersion = user.tokenVersion + 1;
        const token = signJwtToken(user._id, tokenVersion);
        user.tokenVersion = tokenVersion;
        await user.save();
        const response = {
            token,
        };
        return sendSuccessResponse(res, 200, true, translate("refresh_token_success"), "resfresh-token", response);
    } catch (error) {
        next(error);
    }
    return false;
};

export default RefreshToken;
