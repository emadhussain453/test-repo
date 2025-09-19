import mongoose from "mongoose";
import { AmountCalculationType } from "../constants/index.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";

const PaymentMethodSchema = new mongoose.Schema({
    cash: {
        amount: decimalSchema(false, false),
        calculationType: {
            type: String,
            // default: AmountCalculationType.FLAT,
        },
    },
    card: {
        amount: decimalSchema(false, false),
        calculationType: {
            type: String,
            // default: AmountCalculationType.PERCENTAGE,
        },
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setters: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

export default PaymentMethodSchema;
