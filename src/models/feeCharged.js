import mongoose from "mongoose";
import { AmountCalculationType } from "../constants/index.js";

const FeeCharged = new mongoose.Schema({
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0"),
        get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance.toString()).toFixed(4),
    },
    feeAmountWhenCharged: {
        type: mongoose.Schema.Types.Decimal128,
        get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance.toString()).toFixed(4),
    },
    calculationType: {
        type: String,
        enums: Object.values(AmountCalculationType),
    },
    feeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "internal_fees",
    },
    description: {
        type: String,
        trim: true,
    },
});

export default FeeCharged;
