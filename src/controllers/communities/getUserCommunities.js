import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import CommunityUsers from "../../models/communityUsers.js";

const getUserCommunities = async (req, res, next) => {
    try {
        const { translate, query: { page = 1, limit = 10, createdAt = -1 }, user: { _id } } = req;
        const query = { isActive: false, userId: _id };
        const skipDocs = (page - 1) * limit;
        if (Number(limit) > 100 || Number(limit) < 1) throw new ApiError("Limit error", 400, translate("invalid_page_limit"), true);
        if (Number(page) < 1) throw new ApiError("Limit error", 400, translate("invalid_page_number"), true);
        if (![1, -1].includes(Number(createdAt))) throw new ApiError("Invalid createdAt value", 400, translate("invalid_createdAt"), true);

        const [communities, totalCount] = await Promise.all([
            CommunityUsers.find(query).populate({ path: "communityId", select: "name" })
                .sort({ createdAt: Number(createdAt) })
                .skip(skipDocs)
                .limit(Number(limit)),
            CommunityUsers.countDocuments(query),
        ]);
        const finalResponse = {
            communities,
            page: Number(page),
            limit: Number(limit),
            totalCount,
        };
        return sendSuccessResponse(res, 200, true, translate("communities_fetched_successfully"), null, finalResponse);
    } catch (error) {
        next(error);
    }
    return getUserCommunities;
};
export default getUserCommunities;
