import mongoose from "mongoose";
import { FlagsWithColor } from "../constants/index.js";

const flagSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    flag: { type: Number, default: FlagsWithColor.GREEN, enum: [...Object.values(FlagsWithColor)] },
    reason: {
        type: String,
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

const FlagsHistory = mongoose.model("flag_histories", flagSchema);

export default FlagsHistory;
