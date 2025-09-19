import { feeTypes, PomeloCardBLockStatus, PomeloCardTypes } from "../../constants/index.js";
import InternalFees from "../../models/internalFees.js";
import PomeloUsers from "../../models/pomeloUser.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import callApi from "../../utils/callApi.js";
import getShipmentDetails from "../../utils/pomelo/getShipmentDetails.js";

// ----------------- Need To Optimize The API Again -------------------
const getShipment = async (_id, cardPayload) => {
    try {
        const shipmentDetails = await getShipmentDetails(cardPayload.shipmentId);
        if (!shipmentDetails.status) return;

        // update the shipment in the database
        const updatedStatus = await PomeloUsers.findOneAndUpdate({ userId: _id, "cards.cardType": PomeloCardTypes.PHYSICAL }, {
            $set: {
                "cards.$.shipment.status": shipmentDetails.status,
                "cards.$.shipment.statusDetail": shipmentDetails?.status_detail,
                "cards.$.shipment.externalTrackingId": shipmentDetails?.external_tracking_id,
            },
        }, { new: true, writeConcern: { w: "majority" } });
    } catch (error) {
        throw new Error(error);
    }
};
const fetchCardStatus = async (_id, cardId, cardType, cardPayload) => {
    try {
        const params = cardId;
        const cardStatusResp = await callApi.pomelo("pomelo", "cards", "GET", false, params, true, false);
        if (!cardStatusResp.success) {
            throw new Error("Card status unavaialble");
        }
        const { results: { data } } = cardStatusResp;

        if (!data.status) return;

        // update the status of card in the database
        if (data.status !== cardPayload.status) {
            const updatedStatus = await PomeloUsers.findOneAndUpdate({ userId: _id, "cards.cardType": cardType }, {
                $set: {
                    "cards.$.status": data.status,
                },
            }, { new: true, writeConcern: { w: "majority" } });
        }

        // if physical get shipment and update
        if (cardType === PomeloCardTypes.PHYSICAL) {
            await getShipment(_id, cardPayload);
        }
    } catch (error) {
        throw new Error("Something went Wrong");
    }
};
const userDetails = async (req, res, next) => {
    try {
        const { user: { _id, minimumBalance } } = req;
        const { translate } = req;

        const userToOrderCard = await PomeloUsers.findOne({ userId: _id }).select("userId address pomeloUserId isReOrderCardFeeCharged cards").lean();
        if (!userToOrderCard) throw new ApiError("validationError", 400, translate("pomelo_user_not_found"), true);

        const { userId, cards } = userToOrderCard;

        // fetch card status from pomelo
        const arrayOfPromises = [];
        cards.forEach((card) => {
            arrayOfPromises.push(fetchCardStatus(_id, card.cardId, card.cardType, card));
        });
        await Promise.allSettled(arrayOfPromises);

        const fee = await InternalFees.findOne({ feeType: feeTypes.REORDER_CARD });

        // again find the user to fetch latest record from the db
        const updatedUserCard = await PomeloUsers.findOne({ userId: _id }).select("userId address pomeloUserId isReOrderCardFeeCharged cards").lean();
        const { cards: updatedCards, isReOrderCardFeeCharged, address, pomeloUserId } = updatedUserCard;
        const user = {
            userId,
            pomeloUserId,
            isReOrderCardFeeCharged,
            reOrderCardFee: fee?.amount || 0,
            cardShipmentAddress: address,
            minimumBalance,
        };
        updatedCards.forEach(({ cardType, status, shipment, isCardRegisterWithApplePay, freezedByAdmin, lastFourDigits, cardId }) => {
            const isActive = status === PomeloCardBLockStatus.ACTIVE;
            if (cardType === PomeloCardTypes.PHYSICAL) {
                user.hasPhysicalCard = true;
                user.physicalCardStatus = status;
                user.isPhysicalCardActive = isActive;
                user.physicalCardShipmentStatus = shipment?.status;
                user.shipment = shipment;
                user.isPhysicalCardRegisterWithApplePay = isCardRegisterWithApplePay;
                user.isPhysicalCardFreezedByAdmin = freezedByAdmin;
            }
            if (cardType === PomeloCardTypes.VIRTUAL) {
                user.hasVirtualCard = true;
                user.virtualCardStatus = status;
                user.isVirtualCardActive = isActive;
                user.isVirtualCardRegisterWithApplePay = isCardRegisterWithApplePay;
                user.isVirtualCardFreezedByAdmin = freezedByAdmin;
                user.virtualCardLastFourDigits = lastFourDigits;
                user.virtualCardId = cardId;
            }
        });
        return sendSuccessResponse(res, 200, true, translate("user_details_fetched"), "pomeloUser", user);
    } catch (error) {
        next(error);
    }
    return false;
};

export default userDetails;
