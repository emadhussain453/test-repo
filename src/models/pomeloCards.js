import mongoose from "mongoose";
import { PomeloCardTypes } from "../constants/index.js";
import ShipmentSchema from "./pomeloShipment.js";

const CardSchema = new mongoose.Schema({
    cardType: {
        type: String,
        enum: ["PHYSICAL", "VIRTUAL"],
        required: true,
    },
    status: {
        type: String,
        enum: ["CREATED", "SHIPPED", "ACTIVATED", "ACTIVE", "EMBOSSED", "DISABLED", "BLOCKED"],
        required: true,
    },
    statusReason: {
        type: String,
    },
    shipmentId: {
        type: String,
    },
    failedTransactionCount: {
        type: Number,
        default: 0,
    },
    cardId: {
        type: String,
        required: true,
    },
    startDate: {
        type: String,
        required: true,
    },
    lastFourDigits: {
        type: String,
        required: true,
    },
    provider: {
        type: String,
        enum: ["VISA", "MASTERCARD", "AMERICAN_EXPRESS"],
        required: true,
    },
    productType: {
        type: String,
        enum: ["CREDIT", "DEBIT", "PREPAID"],
        required: true,
    },
    freezedByAdmin: {
        type: Boolean,
        default: false,
    },
    freezedByUser: {
        type: Boolean,
        default: false,
    },
    isCardRegisterWithApplePay: {
        type: Boolean,
        default: false,
    },
    shipment: {
        type: ShipmentSchema,
    },
}, {
    timestamps: true,
});
CardSchema.pre("save", function (next) {
    if (this.cardType === PomeloCardTypes.PHYSICAL && !this.shipmentId) {
        throw new Error("Shipment id is required!");
    }
    next();
});

export default CardSchema;
