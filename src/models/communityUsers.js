import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
    },
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "communities",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// indexes
Schema.index({ userId: 1 });
Schema.index({ createdAt: -1 });
Schema.index({ communityId: 1 });

const CommunityUsers = mongoose.model("community_users", Schema);

export default CommunityUsers;
