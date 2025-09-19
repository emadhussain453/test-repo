import getUserSecureToken from "./getUserSecureToken.js";
import PomeloUsers from "../../models/pomeloUser.js";
import addMinutesToCurrentDate from "../addMinutesToCurrentDate.js";

const saveAndGetuserSecureToken = async (userId) => {
    try {
        const pomelouser = await PomeloUsers.findOne({ userId });
        if (!pomelouser) {
            throw new Error("Pomelo User not found");
        }
        const currentTime = new Date().getTime();
        const isTokenExpired = pomelouser.secureData.expiryDate < currentTime;

        if (pomelouser.secureData.accessToken && !isTokenExpired) {
            const payload = {
                success: true,
                results: pomelouser.secureData,
            };
            return payload;
        }

        const secureData = await getUserSecureToken(pomelouser.pomeloUserId);
        const { access_token: accessToken, expires_in: expiresIn, token_type: tokenType } = secureData;
        const expiryDate = addMinutesToCurrentDate(15);
        const payloadToUpdateInDb = {
            accessToken,
            expiresIn,
            tokenType,
            expiryDate,
        };
        pomelouser.secureData = payloadToUpdateInDb;
        await pomelouser.save();

        const payload = {
            success: true,
            results: payloadToUpdateInDb,
        };
        return payload;
    } catch (error) {
        const payload = {
            success: false,
            message: error.message,
        };
        return payload;
    }
};

export default saveAndGetuserSecureToken;
