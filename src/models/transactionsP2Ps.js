import mongoose from "mongoose";
import { Status, feeTypes } from "../constants/index.js";
import { ExchageSchema } from "./exchangeRates.js";
import FeeCharged from "./feeCharged.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";
import metaDataSchema from "./metaDataSchema.js";

const Schema = new mongoose.Schema({
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    required: true,
    get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
    set: (balance) => parseFloat(balance.toString()).toFixed(4),
  },
  receiverAmount: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    required: true,
    get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
    set: (balance) => parseFloat(balance.toString()).toFixed(4),
  },
  localAmount: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
    set: (balance) => parseFloat(balance.toString()).toFixed(4),
  },
  receiverLocalAmount: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
    set: (balance) => parseFloat(balance.toString()).toFixed(4),
  },
  senderLastBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
    set: (amount) => parseFloat(amount.toString()).toFixed(4),
  },
  senderUpdatedBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
    set: (amount) => parseFloat(amount.toString()).toFixed(4),
  },
  receiverLastBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
    set: (amount) => parseFloat(amount.toString()).toFixed(4),
  },
  receiverUpdatedBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
    set: (amount) => parseFloat(amount.toString()).toFixed(4),
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(Status),
    required: true,
  },
  failedReason: {
    type: String,
  },
  fee: {
    type: FeeCharged,
  },
  currentExchageRate: {
    type: ExchageSchema,
  },
  receiverCurrentExchageRate: {
    type: ExchageSchema,
  },
  transactionType: {
    type: String,
    enums: [feeTypes.P2P_TRANSACTION_INTERNATIONAL, feeTypes.P2P_TRANSACTION_LOCAL],
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

// indexes
Schema.index({ from: 1 });
Schema.index({ to: 1 });
Schema.index({ createdAt: -1 });

const TransactionsP2P = mongoose.model("transactions_p2p", Schema);
export default TransactionsP2P;
