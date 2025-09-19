import mongoose from "mongoose";
import { AmountCalculationType, Status, TrnasactionsTypes } from "../constants/index.js";
import { ExchageSchema } from "./exchangeRates.js";
import FeeCharged from "./feeCharged.js";
import metaDataSchema from "./metaDataSchema.js";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    pomeloUserId: {
        type: String,
        required: true,
        trim: true,
    },
    card: {
        type: {
            type: String,
            required: true,
            trim: true,
        },
        id: {
            type: String,
            required: true,
            trim: true,
        },
        productType: {
            type: String,
            required: true,
            trim: true,
        },
        lastFour: {
            type: String,
            required: true,
            trim: true,
        },
    },
    transaction: {
        id: {
            type: String,
            required: true,
            trim: true,
        },
        countryCode: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            trim: true,
        },
        pointType: {
            type: String,
            required: true,
            trim: true,
        },
        entryMode: {
            type: String,
            required: true,
            trim: true,
        },
        origin: {
            type: String,
            required: true,
            trim: true,
        },
        localDateTime: {
            type: String,
            required: true,
            trim: true,
        },
        originalTransactionId: {
            type: String,
            trim: true,
        },
    },
    merchant: {
        id: {
            type: String,
            required: true,
            trim: true,
        },
        mcc: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        name: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
        },

    },
    pomeloWebhooksAmountDetails: {
        local: {
            total: {
                type: mongoose.Schema.Types.Decimal128,
                default: mongoose.Types.Decimal128.fromString("0.0000"),
                get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
                set: (amount) => parseFloat(amount.toString()).toFixed(4),
                required: [true, "local is required."],
            },
            currency: {
                type: String,
                required: true,
                trim: true,
            },
        },
        transaction: {
            total: {
                type: mongoose.Schema.Types.Decimal128,
                default: mongoose.Types.Decimal128.fromString("0.0000"),
                get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
                set: (amount) => parseFloat(amount.toString()).toFixed(4),
                // required: [true, "Amount is required."],
            },
            currency: {
                type: String,
                required: true,
                trim: true,
            },
        },
        settlement: {
            total: {
                type: mongoose.Schema.Types.Decimal128,
                default: mongoose.Types.Decimal128.fromString("0.0000"),
                get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
                set: (amount) => parseFloat(amount.toString()).toFixed(4),
                required: [true, "Amount is required."],
            },
            currency: {
                type: String,
                required: true,
                trim: true,
            },
        },
        details: [

        ],
    },
    localAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
        set: (amount) => parseFloat(amount.toString()).toFixed(4),
        required: [true, "Local amount is required."],
    },
    // localCurrency: String,
    // localAmountToSUSD: {
    //     type: mongoose.Schema.Types.Decimal128,
    //     default: mongoose.Types.Decimal128.fromString("0.0000"),
    //     get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
    //     set: (amount) => parseFloat(amount.toString()).toFixed(4),
    // },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
        set: (amount) => parseFloat(amount.toString()).toFixed(4),
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
    type: {
        type: String,
        enum: [...Object.values(TrnasactionsTypes)],
        required: true,
    },
    method: {
        type: String,
        required: true,
        trim: true,
    },
    currentExchageRate: {
        type: ExchageSchema,
    },
    feeRefund: {
        type: Boolean,
        default: false,
    },
    fee: {
        type: FeeCharged,
    },
    userIpAddress: {
        type: String,
    },
    metaData: {
        type: metaDataSchema,
        default: {},
    },
    extraData: {
        type: Object,
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

// indexes
Schema.index({ userId: 1 });
Schema.index({ status: 1 });
Schema.index({ createdAt: -1 });

const TransactionsCards = mongoose.model("transactions_card", Schema);
export default TransactionsCards;
