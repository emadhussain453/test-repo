import SEND_SANITIZED_SUCCESS_RESPONSE from "../../utils/responses/sendSanitizedSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { USERNAME_REGEX } from "../../constants/regex.js";

function isValidUsername(username) {
    return USERNAME_REGEX.test(username);
}

const createUserName = async (req, res, next) => {
    try {
        const { userName } = req.body;
        const { user, translate } = req;
        if (user.userName === userName) throw new ApiError("invalid details", 400, translate("username_different"), true);

        user.userName = userName;
        await user.save();
        const sanitizedUser = SEND_SANITIZED_SUCCESS_RESPONSE(user);
        return sendSuccessResponse(res, 200, true, translate("username_create_success"), "username", sanitizedUser);
    } catch (error) {
        next(error);
    }
    return false;
};

export default createUserName;
