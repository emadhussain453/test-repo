import Users from "../../models/users.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import logger from "../../logger/index.js";
import { ApiError } from "../../utils/ApiError.js";
import validateSignoutToken from "../../utils/validateSignoutToken.js";

const SignOut = async (req, res, next) => {
    try {
        const { body: { notificationToken, deviceId } } = req;
        const { t: translate } = req;
        const token = req.headers.authorization;
        if (!token) {
            throw new ApiError("Access denied", 401, translate("no_token_provided"));
        }
        const getToken = validateSignoutToken(token);
        if (!getToken.token && getToken?.message) return sendSuccessResponse(res, 200, true, translate("user_logout_success"));
        let user = null;
        if (getToken.token) {
            user = await Users.findOne({ _id: getToken.user.userId }).select(" -__v -createdAt -updatedAt");
            if (!user) {
                throw new ApiError(translate("Access denied"), 401, translate("unauthorized_user"), true);
            }
        }
        const tokenVersion = user.tokenVersion + 1;
        const refreshToken = null;
        if (deviceId) {
            const device = user?.devices.find((userDevice) => userDevice?.deviceId === deviceId);
            if (device) {
                const query = {
                    "devices.$.loginStatus": false,
                    tokenVersion,
                    refreshToken,
                };
                if (!device.isMainDevice) {
                    query["devices.$.notificationStatus"] = false;
                }
                const updatedUser = await Users.updateOne(
                    { _id: user._id, "devices.deviceId": deviceId },
                    { $set: query },
                );
                if (!updatedUser) throw new ApiError("Invalid Credentials", 400, translate("logout_failed"), true);
                logger.info(`${user.email}: User has been logged out through deviceId.`);
            }
        } else {
            const device = user?.devices.find((userDevice) => userDevice?.notificationToken === notificationToken);
            if (device) {
                const query = {
                    "devices.$.loginStatus": false,
                    tokenVersion,
                    refreshToken,
                };
                if (!device.isMainDevice) {
                    query["devices.$.notificationStatus"] = false;
                }
                const updatedUser = await Users.updateOne(
                    { _id: user._id, "devices.notificationToken": notificationToken },
                    { $set: query },
                );
                if (!updatedUser) throw new ApiError("Invalid Credentials", 400, translate("logout_failed"), true);
                logger.info(`User :: ${user._id}: User has been logged out through notificationToken.`);
            }
        }
        return sendSuccessResponse(res, 200, true, translate("user_logout_success"));
    } catch (error) {
        next(error);
    }
    return false;
};

export default SignOut;
