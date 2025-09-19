import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import isValidMdbId from "../../utils/isValidMdbId.js";

const allowNotification = async (req, res, next) => {
    try {
        const { deviceId, notificationToken } = req.body;
        const { user, translate } = req;
        if (!isValidMdbId(deviceId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "deviceId" }), true);
        const checkDevice = await Users.findOne({ _id: user._id, "devices._id": deviceId }, { "devices.$": 1 });
        if (!checkDevice) throw new ApiError("Invalid", 400, translate("active_device_not_found"), true);
        await Users.updateOne(
            { _id: user._id, "devices._id": deviceId },
            { $set: { "devices.$.notificationToken": notificationToken } },
        );
        return sendSuccessResponse(res, 200, true, translate("device_update_success"), "device");
    } catch (error) {
        next(error);
    }
    return false;
};

export default allowNotification;
