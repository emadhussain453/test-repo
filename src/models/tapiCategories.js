import mongoose from "mongoose";
import TapiTags from "./tapiTags.js";
import SubscriptionsTapi from "./subscriptions.js";

const categorySchema = new mongoose.Schema({
    name: {
        en: {
            type: String,
            required: true,
            trim: true,
        },
        es: {
            type: String,
            trim: true,
        },
    },
    type: {
        type: String,
        trim: true,
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "tapi_tags",
    }],
    companies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "tapi_subscriptions",
    }],
}, {
    timestamps: true,
});
categorySchema.index({ "name.en": 1 });
categorySchema.index({ "name.es": 1 });
const Category = mongoose.model("tapi_admin_categories", categorySchema);

export default Category;
