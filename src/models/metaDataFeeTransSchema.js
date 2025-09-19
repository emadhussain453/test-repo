import mongoose from "mongoose";

const metaDataFeeTransSchema = new mongoose.Schema({
    exRateProfit: {
        type: mongoose.Schema.Types.Decimal128,
        get: (balance) => parseFloat(parseFloat(balance?.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance?.toString()).toFixed(4),
        default: 0,
    },
    exRateDifference: {
        type: mongoose.Schema.Types.Decimal128,
        get: (balance) => parseFloat(parseFloat(balance?.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance?.toString()).toFixed(4),
        default: 0,
    },
    stableFeeDetuction: {
        type: mongoose.Schema.Types.Decimal128,
        get: (balance) => parseFloat(parseFloat(balance?.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance?.toString()).toFixed(4),
        default: 0,
    },
    serviceFeeDetuction: {
        type: mongoose.Schema.Types.Decimal128,
        get: (balance) => parseFloat(parseFloat(balance?.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance?.toString()).toFixed(4),
        default: 0,
    },
});

export default metaDataFeeTransSchema;
