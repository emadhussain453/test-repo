import Notifications from "../../models/notifications.js";
import { ApiError } from "../../utils/ApiError.js";
import filterValidIds from "../../utils/filterValidObjectIds.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const deleteNotifications = async (req, res, next) => {
    try {
        const { notificationIds } = req.body;
        const { translate } = req;
        const validIds = filterValidIds(notificationIds);
        if (validIds.length < 1) throw new ApiError("Limit error", 400, "invalid_md_id", true);
        const deleteQuery = { _id: { $in: validIds } };
        const deleteNotifi = await Notifications.deleteMany(deleteQuery);
        sendSuccessResponse(res, 200, true, translate("notifications_deleted_successfully"), "deleteNotifications");
    } catch (error) {
        next(error);
    }
};

export default deleteNotifications;
