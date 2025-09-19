import mongoose from "mongoose";

const cashoutbeneficiary = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    bankDetailsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "banks",
        required: true,
    },
    bankAccount: {
        type: String,
        // required: true,
    },
    category: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    bankName: {
        type: String,
        required: true,
    },
    countryCode: {
        type: String,
        required: true,
    },
    accountType: {
        type: String,
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

cashoutbeneficiary.index({ bankAccount: 1, userId: 1 });
// Create a model for the payment instrument
const CashoutBeneficiary = mongoose.model("cashout_beneficiary", cashoutbeneficiary);

export default CashoutBeneficiary;
