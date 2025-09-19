import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    emails: {
        type: [String],
    },
    status: {
        type: Boolean,
        default: true,
    },
});

Schema.index({ emails: 1 });

const FeatureBetaAccess = mongoose.model("feature_beta_access", Schema);
export default FeatureBetaAccess;
