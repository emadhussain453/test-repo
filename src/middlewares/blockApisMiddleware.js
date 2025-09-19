import { ApiError } from "../utils/ApiError.js";

const blockedApis = (req, res, next) => {
    try {
        const { t: translate } = req;
        if (process.env.NODE_ENV !== "production") return next();
        throw new ApiError("Underdev", 400, translate("api_under_development"), true);
    } catch (error) {
        return next(error);
    }
};
export default blockedApis;
