import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function verifyPasscode(req, res, next) {
    try {
        const { user, body: { passCode }, translate } = req;
        let isPasswordMatching = false;
        try {
            const isPasswordMatched = await user.bcryptComparePassCode(passCode);
            isPasswordMatching = isPasswordMatched;
        } catch (error) {
            isPasswordMatching = false;
        }

        const payload = {
            passwordVerified: isPasswordMatching,
        };
        let response = "incorrect_passcode";
        if (isPasswordMatching) response = "correct_passcode";
        return sendSuccessResponse(res, 200, true, translate(response), "verifyPassocde", payload);
    } catch (error) {
        next(error);
    }
    return false;
}
export default verifyPasscode;
