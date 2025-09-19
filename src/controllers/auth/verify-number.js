import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import SEND_SANITIZED_SUCCESS_RESPONSE from "../../utils/responses/sendSanitizedSuccessResponse.js";
import { EventTypes, HubspotCustomerLifecycleStages, Lenguages, NotificationTitles, NotificationTypes } from "../../constants/index.js";
import Event from "../../Events/databaseLogs.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import HubspotEvents from "../../Events/hubspot.js";

async function NumberVerify(req, res, next) {
    try {
        const { user, userIpAddress, translate } = req; // Destructure 't' from req object

        // now check if the user is already verified
        if (user.mobileVerified) {
            throw new ApiError("already verified", 400, translate("mobile_number_already_verified"), true);
        }
        // now update the user
        user.mobileVerified = true;
        await user.save();
        const sanitizedUser = SEND_SANITIZED_SUCCESS_RESPONSE(user);
        sanitizedUser.devices = user.devices;

        // log user notification
        const eventData = {
            userId: user._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("mobile_number_verified"),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("mobile_number_verified"),
            title: NotificationTitles.Account_Activity,
            type: NotificationTypes.AccountActivity,
            userIpAddress,
        };
        Event.emit(EventTypes.Notification, eventData);
        const eventPayload = { email: user.email, stageId: HubspotCustomerLifecycleStages.NOT_ACCEPTED };
        if (process.env.NODE_ENV === "production") HubspotEvents.emit(EventTypes.UpdateCustomerLifeCycleStage, eventPayload);
        return sendSuccessResponse(res, 200, true, translate("mobile_number_verified"), "verify number", sanitizedUser);
    } catch (error) {
        next(error);
    }
}

export default NumberVerify;
