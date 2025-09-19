import mongoose from "mongoose";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import Communities from "../../models/community.js";
import CommunityUsers from "../../models/communityUsers.js";
import logger from "../../logger/index.js";

const joinCommunity = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session };
    try {
        const { translate, body: { communityId }, user: { _id } } = req;
        if (!isValidMdbId(communityId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "communityId" }), true);
        const findCommunity = await Communities.findOne({ _id: communityId, isDeleted: false, isActive: true });
        if (!findCommunity) throw new ApiError("Invalid Credentials", 400, translate("community_not_found"), true);
        const findCommunityUser = await CommunityUsers.findOne({ communityId, userId: _id });
        if (findCommunityUser) {
            if (findCommunityUser.isActive) throw new ApiError("Invalid Credentials", 400, translate("already_community_active_user"), true);
            await Promise.all([
                CommunityUsers.updateOne({ _id: findCommunityUser._id }, { $set: { isActive: true } }, opts),
                Communities.updateOne({ _id: communityId }, { $inc: { totalUsers: 1 } }, opts),
            ]);
            await session.commitTransaction();
            session.endSession();
            return sendSuccessResponse(res, 200, true, translate("user_join_community_success"), "community");
        }
        const joinCommunityPayload = {
            userId: _id,
            communityId,
        };
        const newCommunityUser = new CommunityUsers(joinCommunityPayload);
        await Promise.all([
            newCommunityUser.save(opts),
            Communities.updateOne({ _id: communityId }, { $inc: { totalUsers: 1 } }, opts),
        ]);
        await session.commitTransaction();
        session.endSession();
        return sendSuccessResponse(res, 200, true, translate("user_join_community_success"), "community");
    } catch (error) {
        logger.error("Aborting join community transaction");
        await session.abortTransaction();
        session.endSession();
        next(error);
    } finally {
        session.endSession();
    }
    return joinCommunity;
};
export default joinCommunity;
