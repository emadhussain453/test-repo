import UserBalance from "../../models/userBalance.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const freshBalance = async (req, res, next) => {
    try {
        const { translate, user: { _id } } = req;
        const userBalance = await UserBalance.findOne({ userId: _id });
        const finalResponse = {
            balance: userBalance?.balance || 0,
        };
        return sendSuccessResponse(res, 200, true, translate("cashin_volume_fetch"), null, finalResponse);
    } catch (error) {
        next(error);
    }
    return freshBalance;
};
export default freshBalance;
