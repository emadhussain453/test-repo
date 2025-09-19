import mongoose from "mongoose";
import moment from "moment-timezone";
import decimalSchema from "../utils/directa24/decimalSchema.js";
import { Status } from "../constants/index.js";
import { ExchageSchema } from "./exchangeRates.js";
import InvoiceFeeSchemav2 from "./invoiceFee.js";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
    },
    amount: decimalSchema(true, false),
    localAmount: decimalSchema(false, false),
    status: {
        type: String,
        enum: Object.values(Status),
        default: Status.PENDING,
        required: true,
    },
    type: String, // payemt_linsk
    description: String,
    expiresAt: {
        type: Date,
        // default: () => moment.utc().add(15, "minutes").toDate(),
        required: true,
    },
    serviceLinkExpiresAt: {
        type: Date,
    },
    countryCode: String,
    secureToken: String,
    payerPersonalDetails: { // addtional optional to save || directly get from FE and sent to D24
        firstName: String,
        lastName: String,
        email: String,
        phoneNumber: String,
        documetType: String,
        documentIdNumber: String,
    },
    payerPaymentDetails: { // additional optional to save || directly get from FE and sent to D24
        country: String,
        category: String, // BANK etc
        paymentMethod: String, // PSE, etc
    },
    serviceCheckoutURL: String,
    initiatePayment: {
        type: Boolean,
        required: true,
        default: false,
    },
    smartLinkId: {
        type: String,
        default: false,
    },
    exchageRates: {
        type: ExchageSchema,
    },
    fee: {
        type: InvoiceFeeSchemav2,
        default: {},
    },
    statusHistory: [{
        _id: false,
        status: {
            type: String,
            enum: Object.values(Status),
        },
        time: Date,
    }],
}, {
    timestamps: true,
    toJSON: { getters: true, setters: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

// indexes
Schema.index({ userId: 1 });
Schema.index({ _id: -1, userId: -1 });

const PaymentLinksSchema = mongoose.model("payment_links", Schema);

export default PaymentLinksSchema;
