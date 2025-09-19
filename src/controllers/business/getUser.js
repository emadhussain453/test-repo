import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Users from "../../models/users.js";

const requireDetails = "_id email phoneNumber firstName isVerified lastName country mobileVerified emailVerified avatar";
const getUser = async (req, res, next) => {
    try {
        const { t: translate } = req;
        let { accountNumber, byId } = req.query;
        byId = byId === "true";
        let dbUser;
        if (!byId) {
            accountNumber = (accountNumber.trim().startsWith("+") ? "" : "+") + accountNumber.trim();
            dbUser = await Users.findOne({ phoneNumber: accountNumber, isVerified: true, isBlocked: false, isDeleted: false }).select(requireDetails).lean();
        } else {
            dbUser = await Users.findOne({ _id: accountNumber, isVerified: true, isBlocked: false, isDeleted: false }).select(requireDetails).lean();
        }
        if (!dbUser) throw new ApiError("Invalid Details", 400, translate("user_not_found"), true);
        return sendSuccessResponse(res, 200, true, translate("user_found"), null, dbUser);
    } catch (error) {
        next(error);
    }
    return getUser;
};
export default getUser;
