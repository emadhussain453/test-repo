import mongoose from "mongoose";
import { Status } from "../constants/index.js";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
    },
    onepayId: {
        type: String,
    },
    kushkiId: {
        type: String,
    },
    bankId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "onepay_kushki_banks_v2",
    },
    accountNumber: {
        type: String,
    },
    onepayAccountId: {
        type: String,
    },
    accountType: {
        type: String,
    },
    kushkiAccountType: {
        type: String,
    },
    favourite: {
        type: Boolean,
        default: false,
        required: true,
    },
    status: {
        type: String,
        default: Status.PENDING,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

Schema.index({ userId: 1 });

const OnepayKushkBenefeciery = mongoose.model("onepay_kushki_beneficiaries", Schema);

export default OnepayKushkBenefeciery;
