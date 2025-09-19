import mongoose from "mongoose";
import { Status } from "../constants/index.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";

const PaymentInfoSchema = new mongoose.Schema({
    type: {
        type: String,
    },
    method: {
        type: String,
    },
    methodName: {
        type: String,
    },
    bank_id: {
        type: String,
    },
    title: {
        type: String,
    },
    subtype: {
        type: String,
    },
    method_type: {
        type: String,
    },
    logo: {
        type: String,
    },
    amount: decimalSchema(false, false),
    expiryDate: {
        type: String,
    },
    reference: {
        type: String,
    },
    destination: String,
    traceId: String,
    readyToSettleAt: String,
    state: String,
    externallyFunded: String,
    fee: decimalSchema(false, false),
    statementDescriptor: String,
    messages: Array,
    idempotencyId: String,
    additionalBuyerCharges: String,
    // failureCode: String,
    // failureMessage: String,
    securityCodeVerification: String,
    feeType: String,
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

export default PaymentInfoSchema;
