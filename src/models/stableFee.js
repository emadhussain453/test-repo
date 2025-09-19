import mongoose from "mongoose";
import { AmountCalculationType } from "../constants/index.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";
import PaymentMethodSchema from "./paymentMethodSchema.js";

const StableFeeSchema = new mongoose.Schema({
    service: {
        type: String,
        enums: ["DIRECTA24"],
        default: "DIRECTA24",
        required: true,
    },
    countryCode: {
        type: String,
        required: true,
    },
    stableFee: {
        calculationType: {
            type: String,
            default: AmountCalculationType.PERCENTAGE,
        },
        amount: decimalSchema(false, true),
    },
    paymentMethod: { type: PaymentMethodSchema },
    serviceFee: {
        calculationType: {
            type: String,
        lowercase: true,
            // default: AmountCalculationType.PERCENTAGE,
        },
        amount: decimalSchema(false, false),
    },
    serviceFeature: String,
}, {
    timestamps: true,
    toJSON: { getters: true, setters: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

StableFeeSchema.index({ countryCode: 1, service: 1, serviceFeature: 1 }, { unique: true });

const StableFees = mongoose.model("stable_fees", StableFeeSchema);

export default StableFees;
