import mongoose from "mongoose";

const scoreRuleSchema = new mongoose.Schema({
    kyc: { type: Number, default: 25 },
    firstCashin: { type: Number, default: 10 },
    orderPhysicalCard: { type: Number, default: 5 },
    orderVirtualCard: { type: Number, default: 5 },
    activatePhysicalCard: { type: Number, default: 10 },
    cashinTransactions: { type: Number, default: 5 },
    keepBalance: { type: Number, default: 5 },
    cardTransaction: { type: Number, default: 5 },
    recharge: { type: Number, default: 5 },
    subscription: { type: Number, default: 5 },
    payBill: { type: Number, default: 5 },
    documentVerification: { type: Number, default: 10 },
    resetSoftBlock: { type: Number, default: 10 },
    // deduction rules
    failedTxn: { type: Number, default: -10 },
    cashinOutSame: { type: Number, default: -15 },
    multiIp: { type: Number, default: -10 },
    multiDevices: { type: Number, default: -5 },
    funsTransferToSuspiciousUser: { type: Number, default: -10 },
}, {
    timestamps: true,
    toJSON: { getters: true, setters: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

const ScoreRule = mongoose.model("score_rules", scoreRuleSchema);

export default ScoreRule;
