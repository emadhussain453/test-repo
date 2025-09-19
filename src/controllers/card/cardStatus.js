import callApi from "../../utils/callApi.js";
import logger from "../../logger/index.js";
import PomeloUsers from "../../models/pomeloUser.js";
import { ApiError } from "../../utils/ApiError.js";
import { feeTypes, PomeloCardTypes } from "../../constants/index.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import InternalFees from "../../models/internalFees.js";

const cardStatus = async (req, res, next) => {
    try {
        // TODO: implement mongodb transactioons
        const { user: { _id }, query: { type, fee } } = req;
        const { translate } = req;
        if (Array.isArray(type)) throw new ApiError("Invalid request", 400, translate("invalid_card_type"), true);
        const cardType = type?.toUpperCase() === PomeloCardTypes.VIRTUAL ? PomeloCardTypes.VIRTUAL : PomeloCardTypes.PHYSICAL;
        if (!Object.values(PomeloCardTypes).includes(type?.toUpperCase())) throw new ApiError("Invalid request", 400, translate("invalid_card_type"), true);

        const userToOrderCard = await PomeloUsers.findOne({ userId: _id });
        if (!userToOrderCard) throw new ApiError("validationError", 400, translate("pomelo_user_not_found"), true);

        const cards = userToOrderCard.cards.find((card) => card.cardType === cardType);
        if (!cards?.cardId) throw new ApiError("validationError", 400, translate("card_not_found", { cardType }), true);
        const params = cards.cardId;
        const cardStatusResp = await callApi.pomelo("pomelo", "cards", "GET", false, params, true, false);
        if (!cardStatusResp.success) {
            logger.error(`pomelo :: ${cardStatusResp.message}`);
            throw new ApiError("Pomelo error", cardStatusResp.status, translate("something_went_wrong", { type }), true);
        }
        const { results: { data } } = cardStatusResp;

        // update the status of card
        await PomeloUsers.findOneAndUpdate({ userId: _id, "cards.cardType": cardType }, {
            $set: {
                "cards.$.status": data.status,
            },
        }, { new: true });

        const { isReOrderCardFeeCharged } = userToOrderCard;
        const finalResponse = {
            ...data,
            ...(cardType === PomeloCardTypes.PHYSICAL && { isReOrderCardFeeCharged }),
            freezedByAdmin: cards.freezedByAdmin,
        };
        if (cardType === PomeloCardTypes.PHYSICAL) {
            const cardFee = await InternalFees.findOne({ feeType: feeTypes.REORDER_CARD });
            if (!cardFee) throw new ApiError("validation error", 400, translate("fee_not_found"), true);
            finalResponse.feeAmount = cardFee.amount;
        }
        return sendSuccessResponse(res, 200, true, translate("card_status_fetched", { cardType }), "cardStatus", finalResponse);
    } catch (error) {
        next(error);
    }
    return false;
};

export default cardStatus;
