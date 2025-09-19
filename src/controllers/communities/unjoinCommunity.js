import mongoose from "mongoose";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import Communities from "../../models/community.js";
import CommunityUsers from "../../models/communityUsers.js";
import logger from "../../logger/index.js";

const unJoinCommunity = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session };
    try {
        const { translate, body: { communityId }, user: { _id } } = req;
        if (!isValidMdbId(communityId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "communityId" }), true);
        const findCommunity = await Communities.findOne({ _id: communityId, isDeleted: false });
        if (!findCommunity) throw new ApiError("Invalid Credentials", 400, translate("community_not_found"), true);
        const findCommunityUser = await CommunityUsers.findOne({ communityId, userId: _id, isActive: true });
        if (!findCommunityUser) throw new ApiError("Invalid Credentials", 400, translate("not_community_active_user"), true);
        await Promise.all([
            CommunityUsers.updateOne({ _id: findCommunityUser._id }, { $set: { isActive: false } }, opts),
            Communities.updateOne({ _id: communityId }, { $inc: { totalUsers: -1 } }, opts),
        ]);
        await session.commitTransaction();
        session.endSession();
        return sendSuccessResponse(res, 200, true, translate("user_unjoin_community_success"), "community");
    } catch (error) {
        logger.error("Aborting un join community transaction");
        await session.abortTransaction();
        session.endSession();
        next(error);
    } finally {
        session.endSession();
    }
    return unJoinCommunity;
};
export default unJoinCommunity;
