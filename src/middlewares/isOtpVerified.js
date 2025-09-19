import Users from "../models/users.js";
import { ApiError } from "../utils/ApiError.js";
import deleteFromCache from "../utils/cache/deleteFromCache.js";
import getFromCache from "../utils/cache/getFromCache.js";
import SetOtpValues from "../utils/setOtpValues.js";

const IsOtpVerified = async (req, res, next) => {
    let user;
    try {
        const { t: translate } = req;
        if (!req.user) {
            const { email } = req.body;
            if (!email) {
                throw new ApiError("Invalid details", 400, translate("email_required"), true);
            }
            user = await Users.findOne({ email: req.body.email.toLowerCase() });
        }
        if (!user) {
            throw new ApiError("Invalid details", 400, translate("email_not_found"), true);
        }
        // const { otpVerified } = user || req.user;
        const otpVerified = await getFromCache(`otp-verified:${user.email}`);
        if (!otpVerified && !user.otpVerified) {
            throw new ApiError("Invalid details", 400, translate("otp_not_verified"), true);
        }
        await deleteFromCache(`otp-verified:${user.email}`);
        await SetOtpValues(user._id);
        next();
    } catch (error) {
        next(error);
    }
};

export default IsOtpVerified;
