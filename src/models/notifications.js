import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
    },
    read: {
        type: Boolean,
        required: true,
        default: false,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    spanishMessage: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    userIpAddress: {
        type: String,
    },

}, { timestamps: true });

// indexes
Schema.index({ userId: 1 });
Schema.index({ createdAt: -1 });
Schema.index({ to: -1, createdAt: -1 });

const Notifications = mongoose.model("notificationsLogs", Schema);

export default Notifications;
