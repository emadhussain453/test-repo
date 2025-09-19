import unblockPomeloCard from "../../utils/unBlocakPomeloCard.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const unBlockCardFromPomelo = async (req, res, next) => {
    try {
        const { userId, cardId } = req.query;
        const data = await unblockPomeloCard({ userId, cardId });

        return sendSuccessResponse(res, 200, true, "card_unBlock", "cardStatusUpdated", data);
    } catch (error) {
        next(error);
    }
    return unBlockCardFromPomelo;
};

export default unBlockCardFromPomelo;
