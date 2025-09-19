import Notifications from "../../models/notifications.js";
import { ApiError } from "../../utils/ApiError.js";
import filterValidIds from "../../utils/filterValidObjectIds.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const updateNotificationsStatus = async (req, res, next) => {
    try {
        const { notificationIds } = req.body;
        const { translate } = req;
        if (notificationIds?.length < 1) throw new ApiError("Limit error", 400, translate("empty_notification_ids"), true);
        const validIds = filterValidIds(notificationIds);
        if (validIds.length < 1) throw new ApiError("Limit error", 400, translate("invalid_md_id"), true);
        const updateQuery = { _id: { $in: validIds } };
        const updatedNotifi = await Notifications.updateMany(updateQuery, { read: true });
        sendSuccessResponse(res, 200, true, translate("notifications_updated_successfully"), "updateNotifications");
    } catch (error) {
        next(error);
    }
};

export default updateNotificationsStatus;
