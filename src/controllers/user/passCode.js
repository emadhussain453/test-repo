import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const updatePasscode = async (req, res, next) => {
    try {
        const { user, body: { passCode }, translate } = req; // Destructure 't' from req object
        if (user.passCode) throw new ApiError("passcode", 400, translate("passcode_cant_change"), true);
        user.passCode = passCode;
        await user.save();
        const responsePayload = {
            passcode: user.passCode,
        };
        return sendSuccessResponse(res, 200, true, translate("passcode_created_success"), "passcode", responsePayload);
    } catch (error) {
        next(error);
    }
    return false;
};

export default updatePasscode;
