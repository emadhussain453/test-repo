import Users from "../../models/users.js";
import addPayee from "../../utils/addPayee.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const createPayee = async (req, res, next) => {
    try {
        const { user: { _id }, body: { phoneNumber, favourite } } = req;
        const { translate } = req;

        if (typeof favourite !== "boolean") {
            throw new ApiError("invalid_details", 400, translate("invalid_favourite_value"), true);
        }

        const payeeDetails = await Users.findOne({ phoneNumber }).lean();
        if (!payeeDetails) {
            throw new ApiError("user_error", 400, translate("user_not_found"), true);
        }
        try {
            const newPayee = await addPayee(_id, payeeDetails, favourite);
            const finalPayload = {
                newPayee,
            };
            return sendSuccessResponse(res, 200, true, translate("create_payee_success"), "createPayee", finalPayload);
        } catch (err) {
            throw new ApiError("Payee error", 400, err.message, true);
        }
    } catch (error) {
        next(error);
    }
    return false;
};

export default createPayee;
