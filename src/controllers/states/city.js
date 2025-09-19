import States from "../../models/states.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const getCities = async (req, res, next) => {
    try {
        const { query: { search }, translate } = req;
        if (!search) {
            throw new ApiError("invalid details", 400, translate("search_required"), true);
        }
        const zipcodes = await States.find({ state: search }).select("city zipcode").sort({ city: 1 }).lean();
        if (!zipcodes || zipcodes.length === 0) {
            throw new ApiError("invalid details", 400, translate("state_not_found"), true);
        }
        return sendSuccessResponse(res, 200, true, translate("state_details_fetched_success"), "zipcodes", zipcodes);
    } catch (error) {
        next(error);
    }
    return false;
};

export default getCities;
