import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    countryCode: {
        type: String,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
    fxRate: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
        set: (amount) => parseFloat(amount.toString()).toFixed(4),
        required: [true, "Service Fee detucted amount is required."],
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

Schema.index({ createdAt: -1 });

const DirectaFxRate = mongoose.model("directa_Fxrate", Schema);

export default DirectaFxRate;
