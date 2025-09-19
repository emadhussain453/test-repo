import mongoose from "mongoose";
import decimalSchema from "../utils/directa24/decimalSchema.js";
import { ExchageSchema } from "./exchangeRates.js";
import InvoiceFeeSchemav2 from "./invoiceFee.js";
import { Status, tapiTransactionTypes } from "../constants/index.js";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    bussinessId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    transactionType: {
        type: String,
        required: [true, "Transaction type is required."],
        enums: [tapiTransactionTypes.SERVICE, tapiTransactionTypes.RECHARGE, tapiTransactionTypes.SUBSCRIPTION],
    },
    metadata: {
        operationId: {
            type: String,
            required: true,
        },
        companyCode: {
            type: String,
            required: true,
        },
        companyName: {
            type: String,
            required: true,
        },
        externalPaymentId: {
            type: String,
            required: true,
        },
        externalClientId: {
            type: String,
            required: true,
        },
        externalRequestId: {
            type: String,
            // required: true,
        },
        status: {
            type: String,
            enums: [Status.PENDING, Status.PROCESSING, Status.COMPLETED, Status.FAILED],
            default: Status.PENDING,
        },
        paymentMethod: {
            type: String,
            enums: ["ACCOUNT", "CARD"],
            default: "ACCOUNT",
        },
        agent: {
            type: String,
            default: null,
        },
        identifiers: {
            type: Array,
            default: [],
        },
        amountType: {
            type: String,
            enums: ["OPEN", "CLOSED"],
        },
        activatePin: String,
        additionalData: String,
        companyLogo: String,
        productDescription: String,
    },
    status: {
        type: String,
        enums: [Status.PENDING, Status.PROCESSING, Status.COMPLETED, Status.FAILED],
        default: Status.PENDING,
    },
    amount: decimalSchema(true, true),
    localAmount: decimalSchema(true, true),
    minTotalBillAmount: decimalSchema(false, false),
    localMinTotalBillAmount: decimalSchema(false, false),
    maxTotalBillAmount: decimalSchema(false, false),
    localMaxTotalBillAmount: decimalSchema(false, false),
    userLastBalance: decimalSchema(false, false),
    userUpdatedBalance: decimalSchema(false, false),
    currency: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        // required: true,
    },
    currentExchangeRate: {
        type: ExchageSchema,
    },
    fee: {
        type: InvoiceFeeSchemav2,
        default: {},
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

const TapiServiceBill = mongoose.model("transactions_tapi_service", Schema);

export default TapiServiceBill;
