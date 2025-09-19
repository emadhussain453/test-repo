import logger from "../../logger/index.js";
import Pomelo from "../../models/pomeloToken.js";
import GenerateNewAccessTokenPomelo from "./generateNewAccessTokenPomelo.js";

const GetPomeloAccessToken = async () => {
    // find the idpal app cradentials from the database
    const pomelo = await Pomelo.findOne({}).lean();
    if (!pomelo) {
        const newToken = await GenerateNewAccessTokenPomelo();
        return newToken;
    }

    // means the has been expired
    const expiresAt = pomelo.expiresAt ?? 0;
    const isTokenExpired = expiresAt < new Date().getTime();
    if (isTokenExpired) {
        const newToken = await GenerateNewAccessTokenPomelo(pomelo._id);
        return newToken;
    }
    return pomelo.accessToken;
};

export default GetPomeloAccessToken;
