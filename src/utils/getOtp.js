import logger from "../logger/index.js";
import Users from "../models/users.js";
import getFromCache from "./cache/getFromCache.js";

const GetOtp = async (email) => {
    try {
        const key = `otp:${email}`;
        const userOtpData = await getFromCache(key);
        if (userOtpData) {
            return userOtpData;
        }
        const getFromDB = await Users.findOne({ email }).select("otp otpExpiry otpExpiryInSeconds otpType otpVerified");
        if (!getFromDB.otp) return false;
        const payload = {
            otp: getFromDB.otp,
            otpType: getFromDB.otpType,
            otpExpiryInSeconds: getFromDB.otpExpiryInSeconds,
            otpExpiry: getFromDB.otpExpiry,
            otpVerified: getFromDB.otpVerified,
        };
        return payload;
    } catch (error) {
        throw new Error(error.message);
    }
};
export default GetOtp;
