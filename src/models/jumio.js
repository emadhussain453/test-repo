import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    accessToken: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

const Jumio = mongoose.model("jumio", Schema);

export default Jumio;
