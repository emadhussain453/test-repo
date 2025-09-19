import jwt from "jsonwebtoken";
import ENV from "../config/keys.js";

function validateSignoutToken(token) {
    try {
        const bearer = token.split(" ");
        const [, bearerToken] = bearer;
        const decoded = jwt.verify(bearerToken, ENV.JWT.SECRET, { ignoreExpiration: true });
        if (!decoded.userId) {
            return {
                token: false,
                message: "Access denied. Token is malformed",
            };
        }
        return {
            token: true,
            user: decoded,
        };
    } catch (error) {
        return {
            token: false,
            message: error.message,
        };
    }
}

export default validateSignoutToken;
