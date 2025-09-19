import Users from "../models/users.js";

/* eslint-disable no-param-reassign */
async function SetOtpValues(userId, otpVerified = false) {
    try {
        const updateQuery = {
            $set: {
                otp: null,
                otpType: null,
                otpExpiry: null,
                otpExpiryInSeconds: null,
                otpVerified,
            },
        };
        await Users.updateOne({ _id: userId }, updateQuery);
    } catch (error) {
        throw new Error(error.message);
    }
}
export default SetOtpValues;
