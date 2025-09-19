import callApi from "../../utils/callApi.js";
import PomeloUsers from "../../models/pomeloUser.js";
import { ApiError } from "../../utils/ApiError.js";
import { EventTypes, Lenguages, NotificationTitles, NotificationTypes, PomeloCardBLockResons, PomeloCardBLockStatus, PomeloCardTypes, StableActiveCountryCodes } from "../../constants/index.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import KEYS from "../../config/keys.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import Event from "../../Events/databaseLogs.js";

const DisableCardByAdmin = async (req, res, next) => {
    try {
        const { query: { userId, cardId: adminProvidedCardId, isReOrderCardFeeCharged, reason = PomeloCardBLockResons.CLIENT_INTERNAL_REASON } } = req;

        if (!adminProvidedCardId) {
            throw new ApiError("validation_error", 400, "cardid must not be empty", true);
        }
        if (!userId) {
            throw new ApiError("validation_error", 400, "Userid must not be empty", true);
        }

        if (!isValidMdbId(userId)) {
            throw new ApiError("validation_error", 400, "UserId must be vaild", true);
        }
        if (!Object.keys(PomeloCardBLockResons).includes(reason)) {
            const validReasons = `[${Object.keys(PomeloCardBLockResons)}]`;
            throw new ApiError("validation_error", 400, "invalid_reasons", true);
        }

        const cardTypeToDisable = PomeloCardTypes.PHYSICAL;

        const pomeloUser = await PomeloUsers.findOne({ userId, cards: { $elemMatch: { cardType: cardTypeToDisable } } }).populate({ path: "userId", select: "country kyc" }).lean();
        if (!pomeloUser) {
            throw new ApiError("validation_error", 400, "pomelo_user_not_found", true);
        }
        const { country: { countryCode }, kyc } = pomeloUser.userId;
        const cardDetails = pomeloUser.cards.find((card) => card.cardType === cardTypeToDisable);

        if (!cardDetails) {
            throw new ApiError("invalid_request", 400, "card_type_not_found", true);
        }
        if (!cardDetails._id.equals(adminProvidedCardId)) {
            throw new ApiError("invalid_request", 400, "card_ids_doesnt_match", true);
        }

        if (cardDetails.status === PomeloCardBLockStatus.DISABLED) {
            throw new ApiError("invalid_request", 400, "card_already_disabled", true);
        }

        const PhysicalAffinityGroupId = kyc?.countryCode === StableActiveCountryCodes.COL ? KEYS.POMELO.PHYSICAL_AFFINITY_GROUP_ID : KEYS.POMELO.MEX_PHYSICAL_AFFINITY_GROUP_ID;
        const VertualAffinityGroupId = kyc?.countryCode === StableActiveCountryCodes.COL ? KEYS.POMELO.VIRTUAL_AFFINITY_GROUP_ID : KEYS.POMELO.MEX_VIRTUAL_AFFINITY_GROUP_ID;
        const blockPayload = {
            affinity_group_id: cardTypeToDisable === PomeloCardTypes.PHYSICAL ? PhysicalAffinityGroupId : VertualAffinityGroupId,
            status: PomeloCardBLockStatus.DISABLED,
            status_reason: reason,
        };
        const cardId = `${cardDetails.cardId}`;
        const updateCardShipmentResp = await callApi.pomelo("pomelo", "cards", "PATCH", blockPayload, cardId, true, false);
        if (!updateCardShipmentResp.success) {
            throw new ApiError("pomelo_error", updateCardShipmentResp.status, "something_went_wrong", true);
        }

        const { results: { data } } = updateCardShipmentResp;
        // update the card status in db as well
        await PomeloUsers.findOneAndUpdate({ userId, "cards.cardType": cardTypeToDisable }, {
            $set: {
                "cards.$.status": data.status,
                "cards.$.statusReason": blockPayload.status_reason,
                isReOrderCardFeeCharged,
            },
        }, { new: true });

        // log user notification
        const eventData = {
            userId,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("disbale_by_admin", { cardType: cardTypeToDisable.toLowerCase() }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("disbale_by_admin", { cardType: cardTypeToDisable.toLowerCase() }),
            title: NotificationTitles.Card_Activity,
            type: NotificationTypes.Card_Activity,
        };
        Event.emit(EventTypes.Notification, eventData);

        return sendSuccessResponse(res, 200, true, "card_status_disable", "cardStatusUpdated", data);
    } catch (error) {
        next(error);
    }
    return false;
};

export default DisableCardByAdmin;
