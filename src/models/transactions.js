import mongoose from "mongoose";
import { StableModelsNames, Status } from "../constants/index.js";
import { ExchageSchema } from "./exchangeRates.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";
import GlobalFeeSchema from "./globalFeeSchema.js";

const Schema = new mongoose.Schema({
    transactionRefrenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "transactionModel",

    },
    transactionModel: {
        type: String,
        required: true,
        enum: Object.values(StableModelsNames),
    },
    transactionType: {
        type: String,
        required: true,
        // enum: Object.values(TransactionTypes),
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    sender: {
        businessId: {
            type: String,
        },
        name: {
            type: String,
        },
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    amount: decimalSchema(true, true),
    localAmount: decimalSchema(false, true),
    receiverAmount: decimalSchema(false, false),
    receiverLocalAmount: decimalSchema(false, false),
    status: {
        type: String,
        enum: Object.values(Status),
        required: true,
    },
    metaData: {
        fee: {
            type: GlobalFeeSchema,
        },
        currentExchageRate: {
            type: ExchageSchema,
        },
        receiverCurrentExchageRate: {
            type: ExchageSchema,
        },
    },

}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

// indexes
Schema.index({ status: -1 });
Schema.index({ transactionType: -1 });
Schema.index({ userId: -1, status: -1 });
Schema.index({ from: -1 });
Schema.index({ to: -1 });
Schema.index({ createdAt: -1 });
Schema.index({ transactionRefrenceId: -1, transactionModel: -1 }, { unique: true });

const Transactions = mongoose.model("transactions", Schema);
export default Transactions;
