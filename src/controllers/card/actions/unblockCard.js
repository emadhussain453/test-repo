import callApi from "../../../utils/callApi.js";
import logger from "../../../logger/index.js";
import PomeloUsers from "../../../models/pomeloUser.js";
import { ApiError } from "../../../utils/ApiError.js";
import { EventTypes, FlagsReasons, Lenguages, NotificationTitles, NotificationTypes, PomeloCardBLockResons, PomeloCardBLockStatus, PomeloCardTypes, StableActiveCountryCodes } from "../../../constants/index.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import KEYS from "../../../config/keys.js";
import { translateWithLenguageSpecifiedV1 } from "../../../middlewares/transalations.js";
import Event from "../../../Events/databaseLogs.js";

const unblockCard = async (req, res, next) => {
    try {
        const { user: { _id, country: { countryCode }, kyc }, query: { type = PomeloCardTypes.PHYSICAL }, translate } = req;

        const cardTypeToBlock = type.toUpperCase() === PomeloCardTypes.VIRTUAL ? PomeloCardTypes.VIRTUAL : PomeloCardTypes.PHYSICAL;
        const pomeloUser = await PomeloUsers.findOne({ userId: _id, cards: { $elemMatch: { cardType: cardTypeToBlock } } }).lean();
        if (!pomeloUser) throw new ApiError("validationError", 400, translate("pomelo_user_not_found"), true);

        const cardDetails = pomeloUser.cards.find((card) => card.cardType === cardTypeToBlock);
        if (pomeloUser.failedTransactionCount >= 7) throw new ApiError("Invalid request", 400, translate("card_failed_through_count"));
        if (!cardDetails) {
            throw new ApiError("Invalid request", 400, translate("card_type_not_found", { cardType: cardTypeToBlock }));
        }
        if (cardDetails?.freezedByAdmin) throw new ApiError("Invalid request", 400, translate("user_card_freezed_by_admin"));
        if (cardDetails.status === PomeloCardBLockStatus.ACTIVE) {
            throw new ApiError("Invalid request", 400, translate("card_already_active"));
        }
        const PhysicalAffinityGroupId = kyc?.countryCode === StableActiveCountryCodes.COL ? KEYS.POMELO.PHYSICAL_AFFINITY_GROUP_ID : KEYS.POMELO.MEX_PHYSICAL_AFFINITY_GROUP_ID;
        const VertualAffinityGroupId = kyc?.countryCode === StableActiveCountryCodes.COL ? KEYS.POMELO.VIRTUAL_AFFINITY_GROUP_ID : KEYS.POMELO.MEX_VIRTUAL_AFFINITY_GROUP_ID;
        const blockPayload = {
            affinity_group_id: cardTypeToBlock === PomeloCardTypes.PHYSICAL ? PhysicalAffinityGroupId : VertualAffinityGroupId,
            status: PomeloCardBLockStatus.ACTIVE,
            status_reason: PomeloCardBLockResons.USER_INTERNAL_REASON,
        };
        const cardId = `${cardDetails.cardId}`;
        const updateCardShipmentResp = await callApi.pomelo("pomelo", "cards", "PATCH", blockPayload, cardId, true, false);
        if (!updateCardShipmentResp.success) {
            logger.error(`pomelo :: ${updateCardShipmentResp.message}`);
            throw new ApiError("Pomelo error", updateCardShipmentResp.status, translate("something_went_wrong"), true);
        }
        const { results: { data } } = updateCardShipmentResp;

        // update the card status in db as well
        await PomeloUsers.findOneAndUpdate({ userId: _id, "cards.cardType": cardTypeToBlock }, {
            $set: {
                "cards.$.status": data.status,
                "cards.$.freezedByUser": false,
            },
        }, { new: true });

        // log user notification
        const eventData = {
            userId: _id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("card_unblock_successfully", { cardType: cardTypeToBlock.toLowerCase() }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("card_unblock_successfully", { cardType: cardTypeToBlock.toLowerCase() }),
            title: NotificationTitles.Card_Activity,
            type: NotificationTypes.Card_Activity,
        };
        Event.emit(EventTypes.Notification, eventData);

        return sendSuccessResponse(res, 200, true, translate("card_status_unblocked"), "cardStausUnblocked", data);
    } catch (error) {
        next(error);
    }
    return false;
};

export default unblockCard;
