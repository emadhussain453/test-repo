/* eslint-disable camelcase */
import print from "../../utils/print.js";
import { ApiError } from "../../utils/ApiError.js";

const validationCashinThroughPSE = (req, res, next) => {
    const { translate } = req;
    try {
        const { amount, description } = req.body;
        if (typeof (amount) !== "number") throw new ApiError("Error in directa Api", 400, translate("amount_invalid_numeric"), true);
        if (description.length < 3) throw new ApiError("Error in directa Api", 400, translate("description_invalid_length"), true);
        next();
    } catch (error) {
        print("validation error ", error);
        throw new ApiError("cashin PSE validation error", 400, translate("something_went_wrong"), true);
    }
};

export default validationCashinThroughPSE;
