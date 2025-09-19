import moment from "moment";
import crypto from "crypto";
import keys from "../config/keys.js";
import { ApiError } from "../utils/ApiError.js";
import { ErrorCodes } from "../constants/index.js";
import ApiConfigurations from "../models/apiConfiguration.js";
import logger from "../logger/index.js";

const isAllowdToCallApi = (status, action) => {
    let isALlowed = false;
    if (!status) isALlowed = true;
    if (action === "allowOnInvalid") isALlowed = true;
    return isALlowed;
};
function hmacMiddleware({ decrypt = true } = {}) {
    return async (req, res, next) => {
        let apiConfig = null;
        if (process.env.NODE_ENV === "local") return next();
        try {
            apiConfig = await ApiConfigurations.findOne({ name: "hmacEnc" }).lean();
        } catch (error) {
            return next();
        }

        if (!apiConfig) return next();

        const { status, metadata: { action } } = apiConfig;

        // admin enbled hmac enc or not
        if (!status) return next();

        const secretKey = keys.HMAC.APP_SECRET;
        if (!decrypt) {
            return next();
        }

        const timestamp = req.headers["x-timestamp"];
        const signature = req.headers["x-signature"];
        const apiEndpoint = req.headers["x-endpoint"];
        let body = "";
        if (req.body && Object.keys(req.body)?.length) body = JSON.stringify(req.body);
        // Construct the message to be signed
        const message = `${timestamp}${apiEndpoint}${body}`;
        try {
            if (!timestamp || !signature) {
                logger.info(`EC001 HMACENCRYPTION`);
                if (isAllowdToCallApi(status, action)) {
                    return next();
                }
                throw new ApiError("Auth", 403, "Access Forbidden", true, ErrorCodes.AUTHORIZATION.INVALID_SIGNATURE);
            }
            const currentTime = moment().utc().unix();
            const requestTime = moment(timestamp).utc().unix();

            if (Math.abs(currentTime - requestTime) > 30) {
                logger.info(`EC002 HMACENCRYPTION`);
                if (isAllowdToCallApi(status, action)) {
                    return next();
                }
                throw new ApiError("Auth", 403, "Access forbidden.", true, ErrorCodes.AUTHORIZATION.INVALID_SIGNATURE);
            }

            // Generate the HMAC signature using the secret key
            let generatedSignature = null;
            try {
                generatedSignature = crypto
                    .createHmac("sha256", secretKey)
                    .update(message)
                    .digest("hex");
            } catch (error) {
                logger.info(`EC003 HMACENCRYPTION`);
                if (isAllowdToCallApi(status, action)) {
                    return next();
                }
                logger.error(error.message);
                throw new ApiError("Auth", 403, "Access forbidden.", true, ErrorCodes.AUTHORIZATION.INVALID_SIGNATURE);
            }

            // Now Compare the signatures
            if (generatedSignature !== signature) {
                logger.info(`EC004 HMACENCRYPTION`);
                if (isAllowdToCallApi(status, action)) {
                    return next();
                }
                if (apiEndpoint !== "/user/upload" && apiEndpoint !== "/auth/refresh-token") throw new ApiError("Auth", 403, "Access forbidden.", true, ErrorCodes.AUTHORIZATION.INVALID_SIGNATURE);
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

export default hmacMiddleware;
