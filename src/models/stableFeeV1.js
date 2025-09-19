import mongoose from "mongoose";
import { AmountCalculationType } from "../constants/index.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";

const StableFeeSchema = new mongoose.Schema({
    service: {
        type: String,
        required: true,
    },
    countryCode: {
        type: String,
        required: true,
    },
    stableCurrency: {
        type: String,
        required: true,
    },
    serviceCurrency: {
        type: String,
        required: true,
    },
    stableFee: [{
        name: String,
        calculationType: {
            type: String,
            lowercase: true,
            default: AmountCalculationType.PERCENTAGE,
        },
        amount: decimalSchema(false, true),
    }],
    serviceFee: [{
        name: String,
        calculationType: {
            type: String,
            lowercase: true,
            default: AmountCalculationType.PERCENTAGE,
        },
        amount: decimalSchema(false, false),
    }],
    serviceFeature: String,
}, {
    timestamps: true,
    toJSON: { getters: true, setters: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

StableFeeSchema.index({ countryCode: 1, service: 1, serviceFeature: 1 }, { unique: true });

const StableFeesV1 = mongoose.model("stable_fees_v1", StableFeeSchema);

export default StableFeesV1;
