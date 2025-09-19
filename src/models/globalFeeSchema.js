import mongoose from "mongoose";

const GlobalFeeSchema = new mongoose.Schema({
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0"),
        get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance.toString()).toFixed(4),
    },
    localAmount: {
        type: mongoose.Schema.Types.Decimal128,
        get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance.toString()).toFixed(4),
    },
    stableFee: {
        type: mongoose.Schema.Types.Decimal128,
        get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance.toString()).toFixed(4),
    },
    serviceFee: {
        type: mongoose.Schema.Types.Decimal128,
        get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance.toString()).toFixed(4),
    },
});

export default GlobalFeeSchema;
