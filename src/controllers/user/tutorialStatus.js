import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function userTutorialStatus(req, res, next) {
    try {
        const { translate, body, user: { _id, tutorial } } = req;
        const result = await Users.updateOne({ _id }, { $set: { tutorial: { ...tutorial, ...body } } }, { returnDocument: "after", new: true });
        if (!result.modifiedCount) {
            throw new ApiError("dberror", 400, translate("something_went_wrong"), true);
        }
        return sendSuccessResponse(res, 200, true, "Tutorial status updated successfully", "USER_TUTORIAL_STATUS", result);
    } catch (error) {
        next(error);
    }
    return false;
}
export default userTutorialStatus;
