/* eslint-disable no-nested-ternary */
// services/pomeloCardService.js
import { PomeloCardBLockResons, PomeloCardBLockStatus, StableActiveCountryCodes } from "../constants/index.js";
import PomeloUsers from "../models/pomeloUser.js";
import KEYS from "../config/keys.js";
import logger from "../logger/index.js";
import { ApiError } from "./ApiError.js";
import callApi from "./callApi.js";

const unblockPomeloCard = async ({ userId, cardId }) => {
    const user = await PomeloUsers.findOne({ userId }).populate({ path: "userId" });
    if (!user) throw new ApiError("validationError", 400, "user not found", true);

    const cardToActivate = user.cards.find((card) => card._id.equals(cardId));
    if (!cardToActivate) throw new ApiError("Invalid request", 400, "card not found");

    if (cardToActivate.status === PomeloCardBLockStatus.ACTIVE) {
        throw new ApiError("Invalid request", 400, "card already active");
    }

    const kyc = user.userId?.kyc;
    const isPhysical = cardToActivate.cardType === "PHYSICAL";
    const isColombia = kyc?.countryCode === StableActiveCountryCodes.COL;

    const affinityId = isPhysical
        ? (isColombia ? KEYS.POMELO.PHYSICAL_AFFINITY_GROUP_ID : KEYS.POMELO.MEX_PHYSICAL_AFFINITY_GROUP_ID)
        : (isColombia ? KEYS.POMELO.VIRTUAL_AFFINITY_GROUP_ID : KEYS.POMELO.MEX_VIRTUAL_AFFINITY_GROUP_ID);

    const activatePayload = {
        affinity_group_id: affinityId,
        status: PomeloCardBLockStatus.ACTIVE,
        status_reason: PomeloCardBLockResons.CLIENT_INTERNAL_REASON,
    };

    const updateCardShipmentResp = await callApi.pomelo("pomelo", "cards", "PATCH", activatePayload, cardToActivate.cardId, true, false);
    if (!updateCardShipmentResp.success) {
        logger.error(`pomelo :: ${updateCardShipmentResp.message}`);
        throw new ApiError("pomelo_error", updateCardShipmentResp.status, "something_went_wrong", true);
    }

    const { results: { data } } = updateCardShipmentResp;

    if (data.status === PomeloCardBLockStatus.ACTIVE) {
        await PomeloUsers.updateOne(
            { userId, "cards._id": cardId },
            {
                $set: {
                    "cards.$.status": data.status,
                },
            },
        );
    }

    return data;
};

export default unblockPomeloCard;
