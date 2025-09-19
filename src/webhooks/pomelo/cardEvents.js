import { POMELO_IP_ADDRESSES, PomeloWebhookStatus, PomeloWebhookStatusDetails } from "../../constants/index.js";
import hashResponseForPomelo from "../../utils/pomelo/hashResponseForPomelo.js";
import sendErrorResponse from "../../utils/pomelo/sendErrorResponse.js";

const cardEvents = (req, res, next) => {
    try {
        if (process.env.NODE_ENV === "production") {
            if (!POMELO_IP_ADDRESSES.includes(req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "Invalid Ip address");
        }
        return hashResponseForPomelo(req, res, false, 200);
    } catch (error) {
        return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, error.message);
    }
};
export default cardEvents;
