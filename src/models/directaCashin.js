import mongoose from "mongoose";
import { Status } from "../constants/index.js";
import PaymentInfoSchema from "./paymentInfo.js";
import InvoiceFeeSchema from "./invoiceFee.js";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    invoiceId: {
        type: String,
        required: true,
    },
    depositId: {
        type: Number,
        required: true,
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
        set: (amount) => parseFloat(amount.toString()).toFixed(4),
        required: [true, "Amount is required."],
    },
    localAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
        set: (amount) => parseFloat(amount.toString()).toFixed(4),
        required: [true, "Local amount is required."],
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
    currency: {
        type: String,
        // enum: ["COP", "USD"],
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    transactionType: {
        type: String,
        enum: ["debit", "credit"],
        required: true,
    },
    type: {
        type: String,
        // enum: ["PSE", "CARD"],
    },
    status: {
        type: String,
        enum: [...Object.values(Status)],
        required: true,
    },
    failedMessage: {
        type: String,
    },
    paymentInfo: { type: PaymentInfoSchema, required: true },
    redirectUrl: {
        type: String,
    },
    fee: {
        type: InvoiceFeeSchema,
        default: {},
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
Schema.index({ depositId: 1 });
Schema.index({ userId: 1 });
Schema.index({ status: 1 });
Schema.index({ createdAt: -1 });

const TransactionsCashIn = mongoose.model("transaction_cashin", Schema);
export default TransactionsCashIn;
