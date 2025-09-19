import { StableActiveCountryCodes } from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";

const excludedEndpoints = ["get-user"];

function verificationMiddleware(req, res, next) {
    try {
        const { user, translate } = req;
        const endpoint = req.originalUrl.split("/").pop();
        const isGlobalUser = user.country?.country === StableActiveCountryCodes.GLOBAL;
        const isExcludedEndpoint = excludedEndpoints.includes(endpoint);
        if (!(isGlobalUser && isExcludedEndpoint)) {
            if (!user.emailVerified) throw new ApiError("Invalid details", 401, translate("email_not_verified"), true);
            if (!user.mobileVerified) throw new ApiError("Invalid details", 401, translate("phone_number_not_verified"), true);
            if (user.kycStatus !== 1) throw new ApiError("Invalid details", 401, translate("kyc_incomplete"), true);
            if (!user.isVerified) throw new ApiError("Invalid details", 401, translate("onboarding_incomplete"), true);
        }
        next();
    } catch (error) {
        next(error);
    }
}

export default verificationMiddleware;
