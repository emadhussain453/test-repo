import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function verifyCurrentPassword(req, res, next) {
    try {
        const { user, body: { currentPassword }, translate } = req;
        let isPasswordMatching = false;
        try {
            const isPasswordMatched = await user.bcryptComparePassword(currentPassword);
            isPasswordMatching = isPasswordMatched;
        } catch (error) {
            isPasswordMatching = false;
        }

        const payload = {
            passwordVerified: isPasswordMatching,
        };
        let response = "incorrect_current_password";
        if (isPasswordMatching) response = "correct_current_password";
        return sendSuccessResponse(res, 200, true, translate(response), "reset Password", payload);
    } catch (error) {
        next(error);
    }
    return false;
}
export default verifyCurrentPassword;
