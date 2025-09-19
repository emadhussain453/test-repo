import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { EventTypes, HubspotCustomerLifecycleStages } from "../../constants/index.js";
import HubspotEvents from "../../Events/hubspot.js";

const deleteUserAccountTemporarily = async (req, res, next) => {
    try {
        const { user, translate } = req;
        const { reason, comment } = req.body;

        const userAlreadyDeleted = user?.isDeleted ?? false;
        if (userAlreadyDeleted) {
            throw new ApiError(translate("user_already_deleted"));
        }
        user.isDeleted = true;
        user.tokenVersion += 1;
        const deletionObj = {};
        if (reason) deletionObj.reason = reason;
        if (comment) deletionObj.comment = comment;

        if (reason || comment) user.deleteInfo = deletionObj;
        await user.save();
        if (process.env.NODE_ENV === "production") HubspotEvents.emit(EventTypes.UpdateCustomerLifeCycleStage, { email: user.email, stageId: HubspotCustomerLifecycleStages.LOST_CUSTOMER });
        return sendSuccessResponse(res, 200, true, translate("user_deleted_successfully"));
    } catch (error) {
        next(error);
    }
    return false;
};

export default deleteUserAccountTemporarily;
