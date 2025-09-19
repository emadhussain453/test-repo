/* eslint-disable node/no-unsupported-features/node-builtins */
import axios from "axios";
import KEYS from "../../config/keys.js";
import JumioToken from "../../models/jumio.js";

const clientId = KEYS.JUMIO.CLIENT_ID;
const clientSecret = KEYS.JUMIO.CLIENT_SECRET;
const authUrl = KEYS.JUMIO.AUTH_URL;

const token = `${clientId}:${clientSecret}`;
const credBase64 = Buffer.from(token).toString("base64");
// let newtoken = {};

async function GenerateNewAccessTokenJumio(_id) {
    try {
        const authHeader = {
            Authorization: `Basic ${credBase64}`,
        };
        const requestBody = new URLSearchParams({
            grant_type: "client_credentials",
        });

        const data = await axios.post(authUrl, requestBody, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
                ...authHeader,
            },
        });
        const { access_token: accessToken, expires_in: expiresIn } = data.data;

        if (!_id) {
            const newToken = new JumioToken({
                accessToken,
                expiresAt: (new Date().getTime() + (expiresIn * 1000)),
            });
            await newToken.save();
        } else {
            await JumioToken.updateOne(
                { _id },
                {
                    $set: {
                        accessToken,
                        expiresAt: (new Date().getTime() + (expiresIn * 1000)),
                    },
                },
                { upsert: true },
            );
        }

        return accessToken;
    } catch (error) {
        throw new Error(error);
    }
}
export default GenerateNewAccessTokenJumio;
