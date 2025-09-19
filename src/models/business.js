import mongoose from "mongoose";
import { Flags, businessTypes } from "../constants/index.js";
import { NAME_REGEX } from "../constants/regex.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";
import kybSchema from "./kybSChema.js";

const Schema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: [true, "name is required"],
        trim: true,
        validate: {
            validator: (v) => NAME_REGEX.test(v),
            message: (props) => `${props.value} is not a valid first name!`,
        },
    },
    mainApplicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ad_user",
        required: true,
        unique: true,
    },
    identificationNumber: {
        type: String,
        trim: true,
    },
    bussinessId: {
        type: String,
        required: [true, "bussinessId is required"],
        unique: true,
        trim: true,
    },
    balance: decimalSchema(true, true),
    isVerified: {
        type: Boolean,
        default: false,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    bussinessLinkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bussiness",
    },
    isBussiness: {
        type: Boolean,
        default: true,
    },
    subsidiariesFinish: {
        type: Boolean,
        default: false,
    },
    country: {
        country: {
            type: String,
            trim: true,
        },
        countryCode: {
            type: String,
            trim: true,
        },
    },
    kyb: {
        type: kybSchema,
        default: {},
    },
    roles: {
        type: [
            {
                name: {
                    type: String,
                    enum: ["superadmin", "editor", "authorizor"],
                    required: true,
                },
                permissions: {
                    type: Array,
                    default: [],
                },
            },
        ],
        default: [
            { name: "superadmin", permissions: [] },
            { name: "editor", permissions: [] },
            { name: "authorizor", permissions: [] },
        ],
    },
    businessType: {
        type: String,
        enum: Object.values(businessTypes),
        default: businessTypes.BUSSINESS,
        required: true,
    },
    flag: { type: Number, default: Flags.ONE, enum: [...Object.values(Flags)] },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

// indexing
Schema.index({ createdAt: -1 });
Schema.index({ bussinessId: 1 });

Schema.statics.sanitize = function aanitize() {
    const { password, createdAt, updatedAt, __v, ...rest } = this.toObject();
    return rest;
};

const Bussiness = mongoose.model("bussiness", Schema);

export default Bussiness;
