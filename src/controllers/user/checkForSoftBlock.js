import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const checkForSoftBlock = (req, res, next) => {
    try {
        const { translate, user: { fraudDetection } } = req;
        let softBlock = false;
        if (fraudDetection?.softBlock) softBlock = true;
        const finalResponse = {
            softBlock,
        };
        return sendSuccessResponse(res, 200, true, translate("cashin_volume_fetch"), null, finalResponse);
    } catch (error) {
        next(error);
    }
    return checkForSoftBlock;
};
export default checkForSoftBlock;
