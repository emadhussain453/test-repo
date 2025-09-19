import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    featureName: {
        type: String,
        trim: true,
    },
    status: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// indexes
Schema.index({ featureName: 1 });

const FeatureStatus = mongoose.model("feature_status", Schema);

export default FeatureStatus;
