import { PomeloWebhookStatus, PomeloWebhookStatusDetails } from "../../constants/index.js";
import logger from "../../logger/index.js";
import hashResponseForPomelo from "./hashResponseForPomelo.js";

const sendErrorResponse = (req, res, status, statusDetails, message, sendPayload = false) => {
    try {
        if (statusDetails === PomeloWebhookStatusDetails.OTHER) {
            logger.error(`__CardTransationApiResult__  Status: ${statusDetails} - Message: ${message}`);
        }
        let statusCode = 200;
        if (statusDetails === PomeloWebhookStatusDetails.SYSTEM_ERROR) statusCode = 200;
        const payload = {
            status: PomeloWebhookStatus.REJECTED,
            status_detail: statusDetails,
            message,
        };
        if (sendPayload) {
            return hashResponseForPomelo(req, res, payload, statusCode);
        }
        return hashResponseForPomelo(req, res, false, statusCode);
    } catch (err) {
        throw new Error(err.message);
    }
};
export default sendErrorResponse;
