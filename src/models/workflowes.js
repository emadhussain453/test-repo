import mongoose from "mongoose";
import { Status } from "../constants/index.js";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    accountId: {
        type: String,
        required: true,
    },
    workflowId: {
        type: String,
        required: true,
    },
    front: {
        type: String,
        default: null,
    },
    back: {
        type: String,
        default: null,
    },
    face: {
        type: String,
        default: null,
    },
    workflowExecution: {
        type: String,
        default: null,
    },
    status: { type: String, default: Status.PENDING, enum: [...Object.values(Status)], required: true },
    expiresAt: {
        type: Number,
        required: true,
    },
    failedMessage: {
        type: String,
    },
}, { timestamps: true });

// indexes
Schema.index({ userId: 1 });
Schema.index({ createdAt: -1 });

const Workflows = mongoose.model("workflows", Schema);

export default Workflows;
