import mongoose from "mongoose";
import { Status } from "../constants/index.js";
import { ExchageSchema } from "./exchangeRates.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";
import metaDataSchema from "./metaDataSchema.js";

const Schema = new mongoose.Schema({
  to: {
    type: String,
    default: "not_required_for_other_banks",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  invoiceId: {
    type: String,
    required: true,
  },
  cashoutId: {
    type: String,
    required: true,
  },
  amount: decimalSchema(true, true),
  localAmount: decimalSchema(true, true),
  currency: {
    type: String,
    // enum: ["COP", "USD"],
    required: true,
  },
  transactionType: {
    type: String,
    enum: ["debit"],
    required: true,
  },
  type: {
    type: String,
    default: "D24",
  },
  status: {
    type: String,
    enum: [...Object.values(Status)],
    required: true,
  },
  statusHistory: [{
    status: {
      type: String,
      enum: [...Object.values(Status)],
    },
    time: Date,
  },
  ],
  failedMessage: {
    type: String,
  },
  address: {
    type: String,
  },
  bankName: {
    type: String,
  },
  userIpAddress: {
    type: String,
  },
  userLastBalance: decimalSchema(false, false),
  userUpdatedBalance: decimalSchema(false, false),
  currentExchageRate: {
    type: ExchageSchema,
  },
  fee: {
    amount: decimalSchema(),
    serviceFeeDetuction: decimalSchema(),
    stableFeeDetuction: decimalSchema(),
    oneStableCoin: decimalSchema(),
    stableFeeWhenCharged: [{
      name: String,
      calculationType: String,
      amount: decimalSchema(),
    }],
    serviceFeeWhenCharged: [{
      name: String,
      calculationType: String,
      amount: decimalSchema(),
    }],
  },
  reimbursed: {
    type: Boolean,
    default: false,
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
Schema.index({ invoiceId: 1 });
Schema.index({ userId: 1 });
Schema.index({ status: 1 });
Schema.index({ createdAt: -1 });

const TransactionsCashOut = mongoose.model("transactions_cashout", Schema);
export default TransactionsCashOut;
