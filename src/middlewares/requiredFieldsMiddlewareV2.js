import { ApiError } from "../utils/ApiError.js";
import validateInputs from "../utils/validateInputs.js";

const requiredFieldsMiddlewareV2 = (schema) => {
    const Handler = (req, res, next) => {
        // get bearer token from header
        try {
            let translate = req.t;
            if (req.user) {
                translate = req.translate;
            }
            const isError = validateInputs(schema, req.body, translate); // returns an object with all the errors
            if (isError) throw new ApiError("Validation error", 400, isError.errorMessage, true);

            next();
        } catch (error) {
            next(error);
        }
    };
    return Handler;
};

export default requiredFieldsMiddlewareV2;
