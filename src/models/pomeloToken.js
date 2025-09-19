import mongoose from "mongoose";
import { StableActiveCountryCodes } from "../constants/index.js";

const Schema = new mongoose.Schema({
    accessToken: {
        type: String,
        required: true,
        // unique: true,
    },
    countryCode: {
        type: String,
        default: StableActiveCountryCodes.COL,
        trim: true,
    },
    expiresAt: {
        type: Number,
        required: true,
    },
    scope: {
        type: String,
        required: true,
        // unique: true,
    },
}, { timestamps: true });

const Pomelo = mongoose.model("pomelo", Schema);

export default Pomelo;
