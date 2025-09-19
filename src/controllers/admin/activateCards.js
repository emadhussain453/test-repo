/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
import mongoose from "mongoose";
import { PomeloCardBLockResons, PomeloCardBLockStatus, PomeloCardTypes, StableActiveCountryCodes } from "../../constants/index.js";
import PomeloUsers from "../../models/pomeloUser.js";
import KEYS from "../../config/keys.js";
import callApi from "../../utils/callApi.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import logger from "../../logger/index.js";

const activatePomeloCard = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, returnDocument: "after", new: true };

    try {
        const { body: { userId, cards, isPhysicalCardBlockThroughCount, isVirtualCardBlockThroughCount } } = req;

        const user = await PomeloUsers.findOne({ userId }).populate({ path: "userId" });
        const kyc = user.userId?.kyc;
        const updatedCards = [];
        const updateFields = {
            failedTransactionCount: 0,
            ...(isPhysicalCardBlockThroughCount && { isPhysicalCardBlockThroughCount: false }),
            ...(isVirtualCardBlockThroughCount && { isVirtualCardBlockThroughCount: false }),
        };

        const affinityGroupMap = {
            [PomeloCardTypes.PHYSICAL]:
                kyc?.countryCode === StableActiveCountryCodes.COL
                    ? KEYS.POMELO.PHYSICAL_AFFINITY_GROUP_ID
                    : KEYS.POMELO.MEX_PHYSICAL_AFFINITY_GROUP_ID,
            [PomeloCardTypes.VIRTUAL]:
                kyc?.countryCode === StableActiveCountryCodes.COL
                    ? KEYS.POMELO.VIRTUAL_AFFINITY_GROUP_ID
                    : KEYS.POMELO.MEX_VIRTUAL_AFFINITY_GROUP_ID,
        };

        for (const card of cards) {
            if (card.freezedByUser || card.freezedByAdmin) continue;

            const affinity_group_id = affinityGroupMap[card.cardType];

            const blockPayload = {
                affinity_group_id,
                status: PomeloCardBLockStatus.ACTIVE,
                status_reason: PomeloCardBLockResons.CLIENT_INTERNAL_REASON,
            };
console.log(card, "cardddddddddddddddd");

            const updateCardShipmentResp = await callApi.pomelo("pomelo", "cards", "PATCH", blockPayload, card.cardId, true, false);
            if (!updateCardShipmentResp.success) {
                logger.error(`pomelo :: ${updateCardShipmentResp.message}`);
                throw new ApiError("pomelo_error", updateCardShipmentResp.status, "something_went_wrong", true);
            }

            const { results: { data } } = updateCardShipmentResp;
            if (data.status === PomeloCardBLockStatus.ACTIVE) {
                await PomeloUsers.updateOne(
                    { userId, "cards.cardId": card.cardId },
                    { $set: { "cards.$.status": data.status } },
                    opts,
                );
                updatedCards.push(data);
            }
        }

        await PomeloUsers.updateOne({ userId }, { $set: updateFields }, opts);

        await session.commitTransaction();
        return sendSuccessResponse(res, 200, true, "cards_status_activated", "cardsStatusUpdated", updatedCards);
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
    return activatePomeloCard;
};

export default activatePomeloCard;
