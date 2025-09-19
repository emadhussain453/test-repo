import mongoose from "mongoose";
import callApi from "../../../utils/callApi.js";
import logger from "../../../logger/index.js";
import PomeloUsers from "../../../models/pomeloUser.js";
import { ApiError } from "../../../utils/ApiError.js";
import { EventTypes, Lenguages, NotificationTitles, NotificationTypes, PomeloCardBLockResons, PomeloCardBLockStatus, PomeloCardTypes, StableActiveCountryCodes } from "../../../constants/index.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import KEYS from "../../../config/keys.js";
import Users from "../../../models/users.js";
import { translateWithLenguageSpecifiedV1 } from "../../../middlewares/transalations.js";
import Event from "../../../Events/databaseLogs.js";

const disableCard = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session };
    try {
        const { translate } = req;
        const { user: { _id, country: { countryCode }, kyc }, query: { reason = PomeloCardBLockResons.CLIENT_INTERNAL_REASON }, user } = req;

        if (!Object.keys(PomeloCardBLockResons).includes(reason)) {
            const validReasons = `[${Object.keys(PomeloCardBLockResons)}]`;
            throw new ApiError("validation_error", 400, translate("invalid_reasons", { validReasons }), true);
        }
        const cardTypeToDisable = PomeloCardTypes.PHYSICAL;

        const pomeloUser = await PomeloUsers.findOne({ userId: _id, cards: { $elemMatch: { cardType: cardTypeToDisable } } }).lean();
        if (!pomeloUser) {
            throw new ApiError("validation_error", 400, translate("pomelo_user_not_found"), true);
        }

        const cardDetails = pomeloUser.cards.find((card) => card.cardType === cardTypeToDisable);

        if (!cardDetails) {
            throw new ApiError("invalid_request", 400, translate("card_type_not_found", { cardType: cardTypeToDisable }), true);
        }
        if (cardDetails?.freezedByAdmin) throw new ApiError("Invalid request", 400, translate("user_card_freezed_by_admin"));

        if (cardDetails.status === PomeloCardBLockStatus.DISABLED) {
            throw new ApiError("invalid_request", 400, translate("card_already_disabled"), true);
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
            logger.error(`pomelo :: ${updateCardShipmentResp.message}`);
            throw new ApiError("pomelo_error", updateCardShipmentResp.status, translate("something_went_wrong"), true);
        }

        const { results: { data } } = updateCardShipmentResp;
        // update the card status in db as well
        await PomeloUsers.findOneAndUpdate({ userId: _id, "cards.cardType": cardTypeToDisable }, {
            $set: {
                "cards.$.status": data.status,
                "cards.$.statusReason": blockPayload.status_reason,
            },
        }, opts);
        const fieldToUpdate = `card.${cardTypeToDisable.toLowerCase()}`;
        await Users.updateOne(
            { _id },
            { $set: { [fieldToUpdate]: false } },
            opts,
        );

         // log user notification
         const eventData = {
            userId: _id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("card_disable_successfully", { cardType: cardTypeToDisable.toLowerCase() }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("card_disable_successfully", { cardType: cardTypeToDisable.toLowerCase() }),
            title: NotificationTitles.Card_Activity,
            type: NotificationTypes.Card_Activity,
        };
        Event.emit(EventTypes.Notification, eventData);

        // commit and end transaction
        await session.commitTransaction();
        session.endSession();
        return sendSuccessResponse(res, 200, true, translate("card_status_disable"), "cardStatusUpdated", data);
    } catch (error) {
        logger.error("Aborting card DISABLED transaction");
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
};

export default disableCard;
