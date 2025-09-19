import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import { EventTypes, Lenguages, NotificationTitles, NotificationTypes } from "../../constants/index.js";
import Event from "../../Events/databaseLogs.js";
import isValidMdbId from "../../utils/isValidMdbId.js";

const changeMainDevice = async (req, res, next) => {
    try {
        const { deviceId, activeDeviceId } = req.body;
        const { user, translate } = req;
        if (!isValidMdbId(deviceId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "deviceId" }), true);
        if (!isValidMdbId(activeDeviceId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "activeDeviceId" }), true);

        const activeDevice = await Users.findOne({ _id: user._id, "devices._id": activeDeviceId }, { "devices.$": 1 });
        if (!activeDevice) throw new ApiError("Invalid", 400, translate("active_device_not_found"), true);
        let newDevice = activeDevice;
        if (deviceId !== activeDeviceId) {
            newDevice = await Users.findOne({ _id: user._id, "devices._id": deviceId }, { "devices.$": 1 });
            if (!newDevice) throw new ApiError("Invalid", 400, translate("second_device_not_found"), true);
        }
        if (newDevice.devices[0].isMainDevice) throw new ApiError("Invalid", 400, translate("already_main_device"), true);
        const mainDevice = user.devices.find((device) => device.isMainDevice);
        if (mainDevice._id) {
            const updateChangeMainDeviceQuery = {
                $set: { "devices.$.isMainDevice": false },
            };
            if (activeDeviceId !== mainDevice?.id) {
                updateChangeMainDeviceQuery.$set["devices.$.notificationStatus"] = false;
                updateChangeMainDeviceQuery.$set["devices.$.loginStatus"] = false;
            }
            await Users.updateOne({ _id: user._id, "devices._id": mainDevice?._id }, updateChangeMainDeviceQuery);
        }
        const updateQuery = {
            $set: { "devices.$.isMainDevice": true },
        };
        if (newDevice.devices[0].notificationToken) updateQuery.$set["devices.$.notificationStatus"] = true;
        const updateUser = await Users.findOneAndUpdate({ _id: user._id, "devices._id": deviceId }, updateQuery, { new: true });
        if (!updateUser) throw new ApiError("Invalid", 400, translate("device_not_updated"), true);
        const model = mainDevice ? mainDevice.deviceModel : "UnKnown";
        const newModel = newDevice.devices[0].deviceModel || "UnKnown";
        // log user notification
        const eventData = {
            userId: user._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("change_main_device", { model, newModel }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("change_main_device", { model, newModel }),
            title: NotificationTitles.Account_Activity,
            type: NotificationTypes.AccountActivity,
        };
        Event.emit(EventTypes.Notification, eventData);
        return sendSuccessResponse(res, 200, true, translate("device_update_success"), "device", { devices: updateUser.devices });
    } catch (error) {
        next(error);
    }
    return false;
};

export default changeMainDevice;
