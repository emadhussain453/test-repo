import mongoose from "mongoose";
import Notifications from "../../models/notifications.js";
import Users from "../../models/users.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const readAllNotifications = async (req, res, next) => {
    try {
        const { user: { _id }, translate } = req;
        const updatePromises = [
            Notifications.updateMany({ userId: _id, read: false }, { read: true }),
            Users.updateOne({ _id }, { $set: { notificationCount: 0 } }),
        ];
        await Promise.allSettled(updatePromises);
        sendSuccessResponse(res, 200, true, translate("notifications_updated_successfully"), "updateNotifications");
    } catch (error) {
        next(error);
    }
};

export default readAllNotifications;
