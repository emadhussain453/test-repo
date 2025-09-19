import mongoose from "mongoose";
import { COLOMBIAN_PHONE_NUMBER_REGEX, EMAIL_REGEX, NAME_REGEX } from "../constants/regex.js";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
    },
    payeeUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
    },
    countryCode: {
        type: String,
        default: "COP",
    },
    favourite: {
        type: Boolean,
        default: false,
        required: true,
    },
    firstName: {
        type: String,
        lowercase: true,
        required: [true, "First name is required"],
        trim: true,
        validate: {
            validator: (v) => NAME_REGEX.test(v),
            message: (props) => `${props.value} is not a valid first name!`,
        },
    },
    lastName: {
        type: String,
        lowercase: true,
        required: [true, "Last name is required"],
        trim: true,
        validate: {
            validator: (v) => NAME_REGEX.test(v),
            message: (props) => `${props.value} is not a valid last name!`,
        },
    },
    phoneNumber: {
        type: String,
        required: [true, "Mobile number is required"],
        trim: true,
        // validate: {
        //     validator: (v) => COLOMBIAN_PHONE_NUMBER_REGEX.test(v),
        //     message: (props) => `${props.value} is not a valid mobile number! like +57xxxxxxxxxx`,
        // },
    },
}, { timestamps: true });

// indexes
Schema.index({ phoneNumber: 1 });
Schema.index({ createdAt: -1 });
Schema.index({ userId: 1, favourite: 1 });
Schema.index({ userId: 1, phoneNumber: 1 });

const Payees = mongoose.model("payees", Schema);
export default Payees;
