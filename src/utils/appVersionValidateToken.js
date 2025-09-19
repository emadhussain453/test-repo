import jwt from "jsonwebtoken";
import ENV from "../config/keys.js";

function appVersionalidateToken(token) {
    try {
        if (!token) {
            return {
                token: false,
                message: "Access denied. No token provided.",
            };
        }

        const bearer = token.split(" ");

        const [, bearerToken] = bearer;

        const decoded = jwt.verify(bearerToken, ENV.JWT.APP_VERSION_SECRET);
        if (!decoded.app) {
            return {
                token: false,
                message: "Access denied. Token is malformed",
            };
        }
        return {
            token: true,
            app: decoded,
        };
    } catch (error) {
        return {
            token: false,
            message: error.message,
        };
    }
}

export default appVersionalidateToken;
