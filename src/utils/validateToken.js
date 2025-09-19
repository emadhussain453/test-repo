import jwt from "jsonwebtoken";
import ENV from "../config/keys.js";

function validateToken(token, secret = ENV.JWT.SECRET) {
    let ignoreExpiration = false;
    try {
        if (process.env.NODE_ENV === "local") ignoreExpiration = true;
        if (!token) {
            return {
                token: false,
                message: "Access denied. No token provided.",
            };
        }

        const bearer = token.split(" ");

        const [, bearerToken] = bearer;

        const decoded = jwt.verify(bearerToken, secret, { ignoreExpiration });
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

export default validateToken;
