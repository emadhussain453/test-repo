import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import Communities from "../../models/community.js";
import { ApiError } from "../../utils/ApiError.js";
import CommunityUsers from "../../models/communityUsers.js";

const getAllCommunities = async (req, res, next) => {
    try {
        const { translate, query: { page = 1, limit = 10, createdAt = -1, onlyUser: checkForUser = false }, user: { _id } } = req;
        const skipDocs = (page - 1) * limit;
        if (Number(limit) > 100 || Number(limit) < 1) throw new ApiError("Limit error", 400, translate("invalid_page_limit"), true);
        if (Number(page) < 1) throw new ApiError("Limit error", 400, translate("invalid_page_number"), true);
        if (![1, -1].includes(Number(createdAt))) throw new ApiError("Invalid createdAt value", 400, translate("invalid_createdAt"), true);
        const onlyUser = checkForUser === "true";
        if (onlyUser) {
            const query = { isActive: true, userId: _id };
            const [communities, totalCount] = await Promise.all([
                CommunityUsers.find(query).populate({ path: "communityId", select: "name isActive" })
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
        }
        const query = { isActive: true, isDeleted: false };
        const [communities, totalCount] = await Promise.all([
            Communities.find(query).select("isBlocked isDeleted name isActive")
                .sort({ createdAt: Number(createdAt) })
                .skip(skipDocs)
                .limit(Number(limit)),
            Communities.countDocuments(query),
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
    return getAllCommunities;
};
export default getAllCommunities;
