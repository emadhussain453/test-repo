import mongoose from "mongoose";
import { Status } from "../constants/index.js";

const kybFieldSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: [...Object.values(Status)],
    },
    key: {
        type: String,
    },
    failedReason: {
        type: String,
    },

}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

const kybSchema = new mongoose.Schema({
    isFinished: {
        type: Boolean,
        default: false,
    },
    bankCertification: {
        type: kybFieldSchema,
        default: {},
    },
    NIT: {
        type: kybFieldSchema,
        default: {},
    },
    chamberComerece: {
        type: kybFieldSchema,
        default: {},
    },
    legalId: {
        type: kybFieldSchema,
        default: {},
    },

}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});
export default kybSchema;
