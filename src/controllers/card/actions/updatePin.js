import callApi from "../../../utils/callApi.js";
import logger from "../../../logger/index.js";
import PomeloUsers from "../../../models/pomeloUser.js";
import { ApiError } from "../../../utils/ApiError.js";
import { EventTypes, Lenguages, NotificationTitles, NotificationTypes, PomeloCardTypes } from "../../../constants/index.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import { translateWithLenguageSpecifiedV1 } from "../../../middlewares/transalations.js";
import Event from "../../../Events/databaseLogs.js";

const updateCardPin = async (req, res, next) => {
    try {
        const { user: { _id, country: { countryCode } }, query: { type = PomeloCardTypes.PHYSICAL }, body: { pin } } = req;
        const { translate } = req;

        if (!pin) throw new ApiError("Invalid request", 400, translate("pin_required"), true);
        if (typeof pin !== "string") throw new ApiError("Invalid request", 400, translate("pin_type"), true);
        const cardTypeToDisable = type.toUpperCase() === PomeloCardTypes.VIRTUAL ? PomeloCardTypes.VIRTUAL : PomeloCardTypes.PHYSICAL;

        const pomeloUser = await PomeloUsers.findOne({ userId: _id, cards: { $elemMatch: { cardType: cardTypeToDisable } } }).lean();
        if (!pomeloUser) throw new ApiError("validationError", 400, translate("pomelo_user_not_found"), true);

        const cardDetails = pomeloUser.cards.find((card) => card.cardType === cardTypeToDisable);

        if (!cardDetails) {
            throw new ApiError("Invalid request", 400, translate("card_type_not_found", { cardType: cardTypeToDisable }));
        }

        const blockPayload = {
            pin,
        };

        const cardId = `${cardDetails.cardId}`;
        const updateCardShipmentResp = await callApi.pomelo("pomelo", "cards", "PATCH", blockPayload, cardId, true, false);
        if (!updateCardShipmentResp.success) {
            logger.error(`pomelo :: ${updateCardShipmentResp.message}`);
            if (updateCardShipmentResp.message === "Card pin must not be equal to previous one.") throw new ApiError("Pomelo error", updateCardShipmentResp.status, translate("same_card_pin"), true);
            throw new ApiError("Pomelo error", updateCardShipmentResp.status, translate("something_went_wrong"), true);
        }
        const { results: { data } } = updateCardShipmentResp;

         // log user notification
        const eventData = {
            userId: _id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("update_pin_successfully"),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("update_pin_successfully"),
            title: NotificationTitles.Card_Activity,
            type: NotificationTypes.Card_Activity,
        };
        Event.emit(EventTypes.Notification, eventData);

        return sendSuccessResponse(res, 200, true, translate("card_pin_updated_successfully"), "cardPinUpdated", data);
    } catch (error) {
        next(error);
    }
    return false;
};

export default updateCardPin;
