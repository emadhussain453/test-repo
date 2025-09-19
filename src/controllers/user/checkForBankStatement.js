import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const userHaveToUploadBankStatement = (req, res, next) => {
    try {
        const { translate, user: { isUserHaveToUploadBankStatement } } = req;
        const finalResponse = {
            userHaveToUploadBankStatement: isUserHaveToUploadBankStatement,
        };
        return sendSuccessResponse(res, 200, true, translate("cashin_volume_fetch"), null, finalResponse);
    } catch (error) {
        next(error);
    }
    return userHaveToUploadBankStatement;
};
export default userHaveToUploadBankStatement;
