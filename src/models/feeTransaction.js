import mongoose from "mongoose";
import decimalSchema from "../utils/directa24/decimalSchema.js";
import { StableModelsNames } from "../constants/index.js";
import metaDataFeeTransSchema from "./metaDataFeeTransSchema.js";

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
    },
    appType: {
        type: String,
    },
    amount: decimalSchema(true, true),
    metaData: {
        type: metaDataFeeTransSchema,
        default: {},
      },

}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

// indexes
Schema.index({ createdAt: -1 });

const FeeTransactions = mongoose.model("transactions_fee_profit", Schema);
export default FeeTransactions;
