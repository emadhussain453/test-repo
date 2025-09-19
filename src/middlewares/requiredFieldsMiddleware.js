/* eslint-disable require-atomic-updates */
import { ApiError } from "../utils/ApiError.js";
import CheckIfAllRequiredFieldsArePresent from "../utils/checkAllRequiredsField.js";
import CheckIfExtraFields from "../utils/extraFields.js";

const requiredFields = (required, checkForExtraFileds = true) => {
    const Handler = (req, res, next) => {
        // get bearer token from header
        try {
            const { t: translate } = req;
            const errors = CheckIfAllRequiredFieldsArePresent(req.body, required); // returns an object with all the errors
            if (Object.keys(errors).length > 0) {
                throw new ApiError("Invalid Details", 400, translate("require_fields", { fields: Object.keys(errors) }), true);
            }

            if (checkForExtraFileds) {
                // check Extra fields
                const extra = CheckIfExtraFields(req.body, required);
                if (Object.keys(extra).length > 0) {
                    throw new ApiError("Invalid Details", 400, translate("extra_fields", { fields: extra }), true);
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
    return Handler;
};

export default requiredFields;
