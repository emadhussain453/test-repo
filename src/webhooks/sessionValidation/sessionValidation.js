/* eslint-disable camelcase */
import ENV from "../../config/keys.js";
import { ApiError } from "../../utils/ApiError.js";
import Users from "../../models/users.js";

async function sessionValidation(req, res, next) {
    try {
        const webToken = req.headers["x-api-key"];
        if (webToken !== ENV.SESSION_VALIDATION.SESSION_VALIDATION) {
            throw new ApiError("Access denied", 403, "Forbidden", true);
        }
        const user = req.headers["x-bank-session"];
        const dbUser = await Users.findOne({ _id: user, isVerified: true, isBlocked: false, isDeleted: false }).lean();
        if (!dbUser) {
            res.status(404).json({ error: "Invalid session token" });
        }
        res.status(200).json({ status: "valid" });
    } catch (error) {
        next(error);
    }
    return sessionValidation;
}
export default sessionValidation;
