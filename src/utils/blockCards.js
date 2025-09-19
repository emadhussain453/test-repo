/* eslint-disable import/no-cycle */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-await-in-loop */
import callApi from "./callApi.js";
import PomeloUsers from "../models/pomeloUser.js";
import { PomeloCardBLockResons, PomeloCardBLockStatus, StableActiveCountryCodes } from "../constants/index.js";
import KEYS from "../config/keys.js";
import { ApiError } from "./ApiError.js";
import { translateWithLenguageSpecifiedV1 } from "../middlewares/transalations.js";

const blockAllCards = async (userId) => {
    const user = await PomeloUsers.findOne({ userId }).populate({ path: "userId" });
    if (!user?.cards?.length) return { success: false };
    for (const card of user.cards) {
        const kyc = user.userId?.kyc;
        const isPhysical = card.cardType === "PHYSICAL";
        const isColombia = kyc?.countryCode === StableActiveCountryCodes.COL;

        const affinityId = isPhysical
            ? (isColombia ? KEYS.POMELO.PHYSICAL_AFFINITY_GROUP_ID : KEYS.POMELO.MEX_PHYSICAL_AFFINITY_GROUP_ID)
            : (isColombia ? KEYS.POMELO.VIRTUAL_AFFINITY_GROUP_ID : KEYS.POMELO.MEX_VIRTUAL_AFFINITY_GROUP_ID);

        const blockPayload = {
            affinity_group_id: affinityId,
            status: PomeloCardBLockStatus.BLOCKED,
            status_reason: PomeloCardBLockResons.CLIENT_INTERNAL_REASON,
        };

        try {
            const updateCardShipmentResp = await callApi.pomelo("pomelo", "cards", "PATCH", blockPayload, card.cardId, true, false);
            if (!updateCardShipmentResp.success) throw new ApiError("Pomelo Block Error", updateCardShipmentResp.status, await translateWithLenguageSpecifiedV1(user?.userId?.language)("something_went_wrong"), true);

            const { results: { data } } = updateCardShipmentResp;
            if (data.status === PomeloCardBLockStatus.BLOCKED) {
                await PomeloUsers.updateOne(
                    { userId, "cards.cardId": card.cardId },
                    {
                        $set: {
                            "cards.$.status": data.status,
                            isVirtualCardBlockThroughCount: true,
                            isPhysicalCardBlockThroughCount: true,
                        },
                    },
                );
            }
        } catch (error) {
            console.error(`Error blocking card ${card.cardId}:`, error);
        }
    }

    return { success: true };
};

export default blockAllCards;
