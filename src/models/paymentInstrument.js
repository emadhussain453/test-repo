import mongoose from "mongoose";

const paymentInstrumentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    sourceId: {
        type: String,
        required: true,
    },
    fraudSessionId: {
        type: String,
        required: true,
    },
    cardName: String,
    expirationMonth: {
        type: Number,
        required: true,
    },
    expirationYear: {
        type: Number,
        required: true,
    },
    lastFour: {
        type: Number,
        required: true,
    },
    brand: String,
    cardType: String,
    name: String,
    address: {
        line1: String,
        line2: String,
        city: String,
        region: String,
        postal_code: String,
        country: String,
    },
    disable: {
        type: Boolean,
        default: false,
    },
    instrumentType: String,
    bin: String,
    type: String,
    currency: String,
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

paymentInstrumentSchema.index({ _id: 1, userId: 1 }, { unique: true });
paymentInstrumentSchema.index({ userId: 1, disable: 1 });
paymentInstrumentSchema.index({ userId: 1, lastFour: 1, expirationMonth: 1, expirationYear: 1, disable: 1 }, { unique: true });
// Create a model for the payment instrument
const PaymentInstrument = mongoose.model("payment_instrument", paymentInstrumentSchema);

export default PaymentInstrument;
