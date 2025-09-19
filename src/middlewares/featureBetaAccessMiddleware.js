import { ApiError } from "../utils/ApiError.js";
import FeatureBetaAccess from "../models/FeatureBetaAccess.js";

const FeatureBetaAccessMiddleware = async (req, res, next) => {
    try {
        const { user: { email }, translate } = req;
        if (process.env.NODE_ENV !== "production") return next();
        const checkEmail = await FeatureBetaAccess.findOne({ $or: [{ emails: { $in: [email] } }, { status: false }] });
        if (!checkEmail) throw new ApiError("Underdev", 400, translate("api_under_development"), true);
        next();
    } catch (error) {
        next(error);
    }
    return true;
};
export default FeatureBetaAccessMiddleware;
