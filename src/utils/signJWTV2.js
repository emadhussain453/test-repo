import jwt from "jsonwebtoken";
import ENV from "../config/keys.js";

function signJwtTokenV2(payload, expiresIn = "7d", secret = ENV.JWT.SECRET) {
    return jwt.sign(payload, secret, {
        expiresIn,
        algorithm: "HS256", // Explicitly set a secure algorithm (HS256 for HMAC)
        issuer: "Stable-life", // Add issuer claim for identifying the issuer
        notBefore: "0", // Prevent token usage before it's issued
    });
}
export default signJwtTokenV2;
