import mongoose from "mongoose";
import ProductsSchema from "./subscriptionProductsSchema.js";

const SubscriptionSchema = mongoose.Schema({
    companyCode: {
        type: "String",
        unique: true,
    },
    companyName: {
        type: "String",
    },
    companyType: {
        type: "String",
    },
    companyLogo: {
        type: "String",
    },
    relatedCompanyName: {
        type: "Mixed",
    },
    tags: {
        type: [
            "String",
        ],
    },
    active: {
        type: "Boolean",
    },
    products: [ProductsSchema],
    customizedOptions: {
        companyName: { type: String },
        companyLogo: { type: String },
        active: { type: Boolean },
    },
});

SubscriptionSchema.index({ tags: 1 });
SubscriptionSchema.index({ companyName: 1 });
SubscriptionSchema.index({ tags: 1, companyName: 1 });

const SubscriptionsTapi = mongoose.model("tapi_subscriptions", SubscriptionSchema);
export default SubscriptionsTapi;
