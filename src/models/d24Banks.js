import mongoose from "mongoose";
import { CashoutCategories, FeatureNames } from "../constants/index.js";

const Schema = new mongoose.Schema({
    bankName: {
        type: String,
    },
    bankCode: {
        type: String,
    },
    countryCode: {
        type: String,
    },
    category: {
        type: String,
        enum: Object.values(CashoutCategories),
    },
    feature: {
        type: String,
        enum: [FeatureNames.cashin, FeatureNames.cashout, FeatureNames.onepay],
    },
    tag: {
        type: String,
        enum: ["iframe", "not iframe"],
        default: "iframe",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    requiredFields: {
        type: Array,
    },
    isFormFieldsRequired: {
        type: Boolean,
        default: false,
    },
}, {
    timeseries: true,
});

Schema.index({ countryCode: 1, category: 1, feature: 1, isActive: 1 });

const D24Banks = mongoose.model("banks", Schema);

export default D24Banks;
