import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";

const deleteDevice = async (req, res, next) => {
    try {
        const { deviceId, activeDeviceId } = req.body;
        const { user, translate } = req;
        if (deviceId === activeDeviceId) throw new ApiError("Invalid", 400, translate("same_device_ids"), true);
        const checkDevice = await Users.findOne({ _id: user._id, "devices.deviceId": activeDeviceId }, { "devices.$": 1 });
        if (!checkDevice) throw new ApiError("Invalid", 400, translate("active_device_not_found"), true);
        if (!checkDevice.devices[0].isMainDevice) throw new ApiError("Invalid", 400, translate("not_main_device"), true);
        const updateQuery = {
            $pull: {
                devices: { deviceId },
            },
        };
        const updateUser = await Users.findOneAndUpdate({ _id: user._id, "devices.deviceId": deviceId }, updateQuery, { new: true });
        if (!updateUser) throw new ApiError("Invalid", 400, translate("deleting_device_not_found"), true);
        return sendSuccessResponse(res, 200, true, translate("device_delete_success"), "device", updateUser.devices);
    } catch (error) {
        next(error);
    }
    return false;
};

export default deleteDevice;
