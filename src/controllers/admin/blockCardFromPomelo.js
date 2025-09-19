import blockPomeloCard from "../../utils/blockPomeloCard.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const blockCardFromPomelo = async (req, res, next) => {
    try {
        const { userId, cardId } = req.query;
        const data = await blockPomeloCard({ userId, cardId });

        return sendSuccessResponse(res, 200, true, "card_block", "cardStatusUpdated", data);
    } catch (error) {
        next(error);
    }
    return blockCardFromPomelo;
};

export default blockCardFromPomelo;
