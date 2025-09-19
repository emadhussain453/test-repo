import logger from "../../logger/index.js";
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const removeOtuField = async (req, res, next) => {
    try {
        const { user: { _id } } = req;

        const fieldNameToRemove = "kycvfotu";
        const result = await Users.updateOne(
            { _id },
            { $unset: { [fieldNameToRemove]: "" } },
        );
        if (!result.modifiedCount) {
            logger.error("Db error :: Failed to remove field");
            throw new ApiError("Something went wrong");
        }

        await sendSuccessResponse(res, 200, true, "Success");
    } catch (error) {
        next(error);
    }
};

export default removeOtuField;
