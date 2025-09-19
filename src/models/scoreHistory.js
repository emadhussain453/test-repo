import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

const ScoreHistory = mongoose.model("score_histories", scoreSchema);

export default ScoreHistory;
