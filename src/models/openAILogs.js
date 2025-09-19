import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    question: { type: String },
    answer: { type: String },
    userIpAddress: { type: String },
    userTempDeviceId: { type: String },
}, { timestamps: true });

const OpenAILogs = mongoose.model("openAILogs", Schema);

export default OpenAILogs;
