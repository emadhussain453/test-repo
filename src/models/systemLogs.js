import mongoose from "mongoose";
import { Status } from "../constants/index.js";

const Schema = new mongoose.Schema({
    type: { type: String },
    date: { type: String },
    requestName: { type: String },
    method: { type: String },
    url: { type: String },
    headers: { type: Object },
    body: { type: Object },
    response: {
        type: Object,
    },
    status: {
        type: String,
        enums: Object.values(Status),
    },
}, { timestamps: true });

Schema.index({ createdAt: -1 });

const SystemLogs = mongoose.model("systemlog", Schema);

export default SystemLogs;
