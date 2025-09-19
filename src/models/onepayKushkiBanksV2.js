import mongoose from "mongoose";
import { FeatureNames } from "../constants/index.js";

const Schema = new mongoose.Schema({
    name: {
        type: String,
    },
    kushkiName: {
        type: String,
    },
    onepayName: {
        type: String,
    },
    onepayId: {
        type: String,
    },
    kushkiId: {
        type: String,
    },
    countryCode: {
        type: String,
        default: "COL",
    },
    feature: {
        type: String,
        enum: [FeatureNames.cashin, FeatureNames.cashout, FeatureNames.onepay],
        default: "cashin",
    },
    tag: {
        type: String,
    },
    logo: {
        type: String,
    },
    mask: {
        type: String,
    },
    instructions: {
        type: String,
    },
    supportedTypes: [{
        type: String,
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timeseries: true,
});

Schema.index({ countryCode: 1, feature: 1, isActive: 1 });

const BanksV2 = mongoose.model("onepay_kushki_banks_v2", Schema);

export default BanksV2;
