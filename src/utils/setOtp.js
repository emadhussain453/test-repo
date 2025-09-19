import Users from "../models/users.js";
import setToCache from "./cache/setToCache.js";

const SetOtp = async (email, payload) => {
    try {
        const key = `otp:${email}`;
        const { otp, otpType, otpExpiry, otpExpiryInSeconds } = payload;
        const updateQuery = {
            $set: {
                otp,
                otpExpiryInSeconds,
                otpExpiry,
                otpType,
                otpVerified: false,
            },
        };
        const isUpdated = await Users.updateOne({ email }, updateQuery);
        const otpSavedToCache = await setToCache(key, payload, otpExpiryInSeconds);
        if (isUpdated.modifiedCount > 1) {
            return true;
        }
        return false;
    } catch (error) {
        throw new Error(error.message);
    }
};
export default SetOtp;
