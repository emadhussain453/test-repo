import { ApiError } from "../utils/ApiError.js";
import { OtpTypes } from "../constants/index.js";
import deleteFromCache from "../utils/cache/deleteFromCache.js";
import GetOtp from "../utils/getOtp.js";
import SetOtpValues from "../utils/setOtpValues.js";

function getOtpType(url) {
    const getTheEndpointname = url.split("/").at(-1);
    let otpType = "";
    switch (getTheEndpointname) {
        case "transfer":
            otpType = OtpTypes.TransactionP2P;
            break;
        case "verify-email":
            otpType = OtpTypes.VerifyEmail;
            break;
        case "verify-phonenumber":
            otpType = OtpTypes.VerifyMobile;
            break;
         case "device":
                otpType = OtpTypes.ChangeMainDevice;
                break;
        default:
            break;
    }
    return otpType;
}

async function VerifyOtpMiddleware(req, res, next) {
    try {
        const { user, body: { otp }, translate } = req;
        const typeOfOtp = getOtpType(req.originalUrl);
        if (user.emailVerified && typeOfOtp === OtpTypes.VerifyEmail) throw new ApiError("already verified", 400, translate("email_already_verified"), true);
        if (user.mobileVerified && typeOfOtp === OtpTypes.VerifyMobile) throw new ApiError("already verified", 400, translate("mobile_number_already_verified"), true);
        const key = `otp:${user.email}`;
        const userOtpData = await GetOtp(user.email);
        if (!userOtpData) throw new ApiError("Invalid Details", 400, translate("otp_expired_or_not_generated"), true);
        if (userOtpData.otp !== otp) throw new ApiError("Invalid Details", 400, "OTP is invalid!", true);
        if (userOtpData.otpType !== typeOfOtp) throw new ApiError("Invalid request :: OTP cross-usage", 400, translate("otp_type_mismatch"));
        await deleteFromCache(key);
        await SetOtpValues(user._id);
        next();
    } catch (error) {
        next(error);
    }
}

export default VerifyOtpMiddleware;
