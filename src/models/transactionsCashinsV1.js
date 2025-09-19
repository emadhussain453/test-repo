import mongoose from "mongoose";
import { Status, StableModelsNames } from "../constants/index.js";
import { ExchageSchema } from "./exchangeRates.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";
import InvoiceFeeSchemav2 from "./invoiceFee.js";
import PaymentInfoSchema from "./paymentInfo.js";
import metaDataSchema from "./metaDataSchema.js";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    invoiceId: {
        type: String,
        required: true,
    },
    depositId: {
        type: String,
        required: true,
    },
    amount: decimalSchema(true, true),
    localAmount: decimalSchema(true, true),
    userLastBalance: decimalSchema(false, false),
    userUpdatedBalance: decimalSchema(false, false),
    currency: {
        type: String,
        // enum: ["COP", "USD"],
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    transactionType: {
        type: String,
        enum: ["debit", "credit"],
        required: true,
    },
    type: {
        type: String,
        // enum: ["PSE", "CARD"],
    },
    status: {
        type: String,
        enum: Object.values(Status),
        required: true,
    },
    statusHistory: [{
        status: {
            type: String,
            enum: [...Object.values(Status)],
        },
        time: Date,
    }],
    paymentInfo: { type: PaymentInfoSchema },

    redirectUrl: {
        type: String,
    },
    currentExchangeRate: {
        type: ExchageSchema,
    },
    fee: {
        type: InvoiceFeeSchemav2,
        default: {},
    },
    userIpAddress: {
        type: String,
    },
    paymentLinkRefranceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "payment_links",
    },
    D24ExRate: {
        fxRate: decimalSchema(false, false),
        currency: {
            type: String,
        },
        convertedAmount: decimalSchema(false, false),
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
Schema.index({ depositId: 1 });
Schema.index({ status: 1 });
Schema.index({ userId: 1 });
Schema.index({ createdAt: -1 });

const CashinTransactionsV1 = mongoose.model(StableModelsNames.CASHIN_V1, Schema);
// export default OnePayCashin;

export default CashinTransactionsV1;
