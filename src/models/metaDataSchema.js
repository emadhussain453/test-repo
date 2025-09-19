import mongoose from "mongoose";

const metaDataSchema = new mongoose.Schema({
    exRateProfit: {
        type: mongoose.Schema.Types.Decimal128,
        get: (balance) => parseFloat(parseFloat(balance?.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance?.toString()).toFixed(4),
        default: 0,
    },
    totalProfit: {
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
});

export default metaDataSchema;
