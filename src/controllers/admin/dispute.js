import callApi from "../../utils/callApi.js";
import logger from "../../logger/index.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const cardDispute = async (req, res, next) => {
    try {
        const { body: { content } } = req;

        if (!Array.isArray(content) || content.length === 0) throw new ApiError("Bad Request", 400, "please provide valid data array", true);
        const errorArray = [];
        const results = await Promise.all(content.map(async (body) => {
            const response = await callApi.pomelo("pomelo", "chargebacks", "POST", body, false, true, false);
            if (!response.success) {
                logger.error(`Pomelo error - TransactionID: ${body.transaction_id}, Message: ${response.message}`);
                // throw new ApiError("pomelo_error", response.status, response.message, true);
                errorArray.push({
                    transactionId: body.transaction_id,
                    message: response.message,
                });
            }
            return response.results?.data;
        }));

        return sendSuccessResponse(res, 200, true, "Dispute API called successfully.", "cardDispute", { results, errorArray });
    } catch (error) {
        logger.error(`cardDispute error: ${error.message}`);
        next(error);
    }
    return true;
};

export default cardDispute;
