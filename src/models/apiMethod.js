import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    methodName: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// indexes
Schema.index({ methodName: 1 });

const ApiMethod = mongoose.model("api_method", Schema);

export default ApiMethod;
