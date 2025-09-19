import mongoose from "mongoose";
import { PomeloCardTypes } from "../constants/index.js";

const ShipmentSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["CREATED", "CANCELLED", "PENDING", "TRACKED", "REJECTED", "IN_WAREHOUSE", "IN_TRANSIT", "FAILED_DELIVERY_ATTEMPT", "DISTRIBUTION", "DELIVERED", "NOT_DELIVERED", "START_OF_CUSTODY", "END_OF_CUSTODY", "DESTRUCTION", "ACCIDENT"],
        required: true,
    },
    statusDetail: {
        type: String,
        required: true,
    },
    shipmentType: {
        type: String,
        // required: true,
    },
    shipmentCreatedAt: {
        type: String,
        // required: true,
    },
    courier: {
        company: {
            type: String,
            // required: true,
        },
        trackingURL: {
            type: String,
        },
    },
    externalTrackingId: {
        type: String,
        // required: true,
    },
}, {
    timestamps: true,
});

export default ShipmentSchema;
