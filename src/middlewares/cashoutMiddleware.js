import { ApiError } from "../utils/ApiError.js";
import CheckIfAllRequiredFieldsArePresent from "../utils/checkAllRequiredsField.js";

const arrayOfRequiredFields = ["amount", "bankAccount", "bankBranch", "bankName", "accountType"];
function cashOutMiddleware(req, res, next) {
    try {
        const { balance } = req.user;
        const { amount, bankAccount, bankBranch, bankName, accountType } = req.body;
        const errors = CheckIfAllRequiredFieldsArePresent(req.body, arrayOfRequiredFields); // returns an object with all the errors
        if (Object.keys(errors).length > 0) {
            throw new ApiError("Invalid Details", 400, `Please fill out the required fields : ${Object.keys(errors)} `, true);
        }

        // if (amount < 50) throw new ApiError("Invalid amount", 400, "Invalid amount. The minimum is COP 50 or equivalent in USD", true);
        if (balance < amount) throw new ApiError("Invalid amount", 400, "Incificent balance", true);
        next();
    } catch (error) {
        next(error);
    }
}

export default cashOutMiddleware;
