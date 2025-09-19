import mongoose from "mongoose";
import { AmountCalculationType } from "../constants/index.js";

const Schema = new mongoose.Schema({
    feeType: { // Fee type (e.g., 'p2p', 'remittance', 'card_activation', 'atm_transaction')
        type: String,
        required: [true, "Fee type is required."],
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
        set: (amount) => parseFloat(amount.toString()).toFixed(4),
        // required: [true, "Fee amount is required."],
    },
    calculationType: { // either percentage or flat
        type: String,
        default: AmountCalculationType.PERCENTAGE,
        enums: Object.values(AmountCalculationType),
    },
    description: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

// indexes
Schema.index({ feeType: 1 });
Schema.index({ createdAt: -1 });

const InternalFees = mongoose.model("internal_fees", Schema);

export default InternalFees;
