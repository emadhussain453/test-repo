import mongoose from "mongoose";

const feeWalletSchema = new mongoose.Schema({
    balance: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance.toString()).toFixed(4),
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
  });

const Wallet = mongoose.model("wallet", feeWalletSchema);

export default Wallet;
