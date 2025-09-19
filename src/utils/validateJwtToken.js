import jwt from "jsonwebtoken";

function validateJwtToken(token, secret) {
    try {
        if (!token) {
            return {
                token: false,
                key: "no_token_provided",
                message: "Access denied. No token provided.",
            };
        }

        const parts = token.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return {
                token: false,
                key: "ivalid_token_format",
                message: "Invalid token format.",
            };
        }

        const bearerToken = parts[1];

        // Limit the size of the token (JWT typically doesn't exceed 10KB)
        if (bearerToken.length > 10000) {
            return {
                token: false,
                key: "token_too_large",
                message: "Token too large.",
            };
        }

        const jwtPayload = jwt.verify(bearerToken, secret, {
            algorithms: ["HS256"],
            ignoreExpiration: true,
        });

        return {
            token: true,
            jwtPayload,
        };
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return {
                token: false,
                key: "token_expired",
                message: "Token expired.",
            };
        }
        return {
            token: false,
            key: "something_went_wrong",
            message: error.message,
        };
    }
}
export default validateJwtToken;
