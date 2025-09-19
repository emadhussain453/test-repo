import Jumio from "../../models/jumio.js";
import GenerateNewAccessTokenJumio from "./generateNewJumioAccessToken.js";

const GetJumioAccessToken = async () => {
    // find the idpal app cradentials from the database
    const jumio = await Jumio.findOne({}).lean();
    if (!jumio) {
        const newToken = await GenerateNewAccessTokenJumio();
        return newToken;
    }
    // means the has been expired
    const expiresAt = jumio.expiresAt ?? 0;
    const isTokenExpired = expiresAt < new Date().getTime();
    if (isTokenExpired) {
        const newToken = await GenerateNewAccessTokenJumio(jumio._id);
        return newToken;
    }
    return jumio.accessToken;
};

export default GetJumioAccessToken;
