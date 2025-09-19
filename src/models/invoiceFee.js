import mongoose from "mongoose";
import decimalSchema from "../utils/directa24/decimalSchema.js";

const InvoiceFeeSchemav2 = new mongoose.Schema({
    amount: decimalSchema(true, true),
    localAmount: decimalSchema(true, true),
    serviceFeeDetuction: decimalSchema(true, true),
    stableFeeDetuction: decimalSchema(true, true),
    serviceFeeDetuctionLocal: decimalSchema(true, true),
    stableFeeDetuctionLocal: decimalSchema(true, true),
    oneStableCoin: decimalSchema(true, true),
    stableFeeWhenCharged: [{
        name: String,
        calculationType: String,
        amount: decimalSchema(false, true),
    }],
    serviceFeeWhenCharged: [{
        paymentMethodType: String,
        name: String,
        calculationType: String,
        amount: decimalSchema(false, true),
    }],
    serviceFeeAfter: decimalSchema(false, true),
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

export default InvoiceFeeSchemav2;
