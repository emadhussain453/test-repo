import mongoose from "mongoose";
import { feeTypes, Status } from "../constants/index.js";
import { ExchageSchema } from "./exchangeRates.js";
import FeeCharged from "./feeCharged.js";
import metaDataSchema from "./metaDataSchema.js";

const Schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
    set: (amount) => parseFloat(amount.toString()).toFixed(4),
    required: [true, "Amount is required."],
  },
  localAmount: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
    set: (amount) => parseFloat(amount.toString()).toFixed(4),
    required: [true, "Local amount is required."],
  },
  userLastBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
    set: (amount) => parseFloat(amount.toString()).toFixed(4),
  },
  userUpdatedBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0000"),
    get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
    set: (amount) => parseFloat(amount.toString()).toFixed(4),
  },
  status: {
    type: String,
    enum: [...Object.values(Status)],
    required: true,
  },
  fee: {
    type: FeeCharged,
  },
  currentExchageRate: {
    type: ExchageSchema,
  },
  feeType: {
    type: String,
    enums: [feeTypes.REORDER_CARD],
  },
  transactionType: {
    type: String,
    required: true,
    default: "fee",
},
  userIpAddress: {
    type: String,
  },
  metaData: {
    type: metaDataSchema,
    default: {},
  },
}, {
  timestamps: true,
  toJSON: { getters: true, setter: true },
  toObject: { getters: true, setters: true },
  runSettersOnQuery: true,
});

// indexes
Schema.index({ userId: 1 });
Schema.index({ createdAt: -1 });

const FeeTransactions = mongoose.model("transactions_fee", Schema);
export default FeeTransactions;
