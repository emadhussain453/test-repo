import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const userConfirmation = async (req, res, next) => {
    try {
        const { user } = req;
        const { translate } = req;
        if (user.kycStatus !== 1) throw new ApiError("kycError", 400, translate("kyc_verification_incomplete"), true);
        if (user.isVerified) {
            throw new ApiError("already_verified", 400, translate("user_already_verified"), true);
        }
        user.isVerified = true;
        await user.save();

        return sendSuccessResponse(res, 200, true, translate("user_verified_successfully"), null, user);
    } catch (error) {
        next(error);
    }
    return true;
};

export default userConfirmation;
