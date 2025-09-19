import mongoose from "mongoose";
import { Status, feeTypes } from "../constants/index.js";
import { ExchageSchema } from "./exchangeRates.js";
import FeeCharged from "./feeCharged.js";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    from: {
        business: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        senderName: {
            type: String,
            required: true,
        },
        senderBusinessId: {
            type: String,
            required: true,
        },
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        required: true,
        get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance.toString()).toFixed(4),
    },
    localAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance.toString()).toFixed(4),
    },
    userLastBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
        set: (amount) => parseFloat(amount.toString()).toFixed(4),
    },
    userUpdatedBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
        set: (amount) => parseFloat(amount.toString()).toFixed(4),
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(Status),
        required: true,
    },
    failedReason: {
        type: String,
    },
    fee: {
        type: FeeCharged,
    },
    currentExchageRate: {
        type: ExchageSchema,
    },
    transactionType: {
        type: String,
        enums: [feeTypes.B2C_TRANSACTION_INTERNATIONAL, feeTypes.B2C_TRANSACTION_LOCAL],
    },
    userIpAddress: {
        type: String,
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

// indexes
Schema.index({ from: 1 });
Schema.index({ to: 1 });
Schema.index({ createdAt: -1 });

const BusinessTransaction = mongoose.model("business_transaction", Schema);
export default BusinessTransaction;
