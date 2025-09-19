import jwt from "jsonwebtoken";
import ENV from "../config/keys.js";

function signJwtToken(userId, tokenVersion, deviceId) {
    const payload = { userId, tokenVersion };
    if (deviceId) payload.deviceId = deviceId;
    return jwt.sign(payload, ENV.JWT.SECRET, {
        expiresIn: ENV.JWT.TOKEN_EXPIRY,
    });
}
export default signJwtToken;
