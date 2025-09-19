import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const userBalanceHistory = async (req, res, next) => {
    try {
        const { translate, user } = req;
        const { user: { minimumBalance, isUserAbleToOrderCard: ableToOrderCard } } = req;
        let isUserAbleToOrderCard = ableToOrderCard;
        if (minimumBalance >= 25 && !ableToOrderCard) {
            isUserAbleToOrderCard = true;
            user.isUserAbleToOrderCard = true;
            await user.save();
        }
        const finalResponse = {
            isUserAbleToOrderCard,
            balanceHistory: minimumBalance,
        };
        return sendSuccessResponse(res, 200, true, translate("balance_history"), null, finalResponse);
    } catch (error) {
        next(error);
    }
    return userBalanceHistory;
};
export default userBalanceHistory;
