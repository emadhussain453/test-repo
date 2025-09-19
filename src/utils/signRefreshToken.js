import jwt from "jsonwebtoken";
import ENV from "../config/keys.js";

function signRefreshToken(payload) {
    return jwt.sign(payload, ENV.JWT.REFRESH_TOKEN_SECRET, {
        expiresIn: ENV.JWT.REFRESH_TOKEN_EXPIRY,
    });
}
export default signRefreshToken;
