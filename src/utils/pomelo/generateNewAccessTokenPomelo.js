/* eslint-disable node/no-unsupported-features/node-builtins */
import KEYS from "../../config/keys.js";
import PomeloToken from "../../models/pomeloToken.js";
import { ApiError } from "../ApiError.js";
import axios from "../../config/axios.js";

const audience = KEYS.POMELO.AUDIENCE;
const grantType = KEYS.POMELO.GRANT_TYPE;

async function GenerateNewAccessTokenPomelo(_id) {
    const clientId = KEYS.POMELO.CLIENT_ID;
    const clientSecret = KEYS.POMELO.CLIENT_SECRET;
    try {
        const requestBody = {
            client_id: clientId,
            client_secret: clientSecret,
            audience,
            grant_type: grantType,
        };
        const URL = `${KEYS.POMELO.AUTH_URL}/oauth/token`;
        const response = await axios.post(URL, requestBody);
        const { access_token: accessToken, expires_in: expiresIn, scope } = response.data;

        if (!_id) {
            const newToken = new PomeloToken({
                accessToken,
                expiresAt: (new Date().getTime() + (expiresIn * 1000)),
                scope,
            });
            await newToken.save();
        } else {
            await PomeloToken.updateOne(
                { _id },
                {
                    $set: {
                        accessToken,
                        expiresAt: (new Date().getTime() + (expiresIn * 1000)),
                        scope,
                    },
                },
                { upsert: true },
            );
        }
        return accessToken;
    } catch (error) {
        throw new ApiError("Pomelo token", 400, error.message, true);
    }
}
export default GenerateNewAccessTokenPomelo;
