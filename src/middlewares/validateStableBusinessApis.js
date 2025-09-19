import crypto from "crypto-js";
import ENV from "../config/keys.js";
import { ApiError } from "../utils/ApiError.js";

const signatureValidationMiddleware = (req, res, next) => {
    try {
        const { headers, body } = req;
        const { "x-date": xDateHeader, "stable-app-signature": signatureHeader } = headers;
        const stableAppSecret = ENV.STABLE_BUSINESS.API_SIGNATURE;
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
    return signatureValidationMiddleware;
};

export default signatureValidationMiddleware;
