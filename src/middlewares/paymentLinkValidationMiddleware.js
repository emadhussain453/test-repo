import crypto from "crypto-js";
import ENV from "../config/keys.js";
import { ApiError } from "../utils/ApiError.js";

const paymentLinkValidationMiddleware = (req, res, next) => {
    try {
        const { headers, body } = req;
        const { "x-date": xDateHeader, "stable-app-payment-link": signatureHeader } = headers;
        const stableAppSecret = ENV.PAYMENT_LINK.API_SIGNATURE_KEY_FOR_PAYMENT_LINK;
        let data = `${xDateHeader}`;
        if (body && Object.keys(body).length > 0) {
            data += `${JSON.stringify(body)}`;
        }
        const hash = crypto.HmacSHA256(data, stableAppSecret).toString();
        const expectedSignature = `Stable ${hash}`;
        if (signatureHeader !== expectedSignature) throw new ApiError("Access denied", 401, "Unauthorized access", true);
        next();
    } catch (error) {
        next(error);
    }
    return paymentLinkValidationMiddleware;
};

export default paymentLinkValidationMiddleware;
