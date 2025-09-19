import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Users from "../../models/users.js";
import Payees from "../../models/payees.js";

const requireDetails = "_id email phoneNumber firstName lastName avatar";
const getUser = async (req, res, next) => {
    try {
        const { user: { _id, phoneNumber: loginUserPhoneNumber }, translate } = req;
        const { phoneNumber } = req.body;
        if (loginUserPhoneNumber === phoneNumber) throw new ApiError("Invalid Details", 400, translate("itself_phoneNumber"), true);
        const dbUser = await Users.findOne({ phoneNumber, isVerified: true, isDeleted: false, isBlocked: false }).select(requireDetails).lean();
        if (!dbUser) throw new ApiError("Invalid Details", 400, translate("user_not_found"), true);
        const isPayee = await Payees.findOne({ userId: _id, payeeUserId: dbUser._id });
        const payload = {
            ...dbUser,
        };
        if (!isPayee) {
            payload.isPayee = {};
            payload.isFavourite = false;
        } else {
            payload.isPayee = isPayee;
            payload.favourite = isPayee.favourite;
        }

        return sendSuccessResponse(res, 200, true, translate("user_found"), null, payload);
    } catch (error) {
        next(error);
    }
    return getUser;
};
export default getUser;
