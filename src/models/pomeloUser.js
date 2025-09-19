import mongoose from "mongoose";
import { EMAIL_REGEX } from "../constants/regex.js";
import cardSchema from "./pomeloCards.js";

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users",
    },
    pomeloUserId: {
        type: String,
        trim: true,
    },
    pomeloClientId: {
        type: String,
        trim: true,
    },
    isUserAbleToOrderCard: {
        type: Boolean,
        default: false,
    },
    isReOrderCardFeeCharged: {
        type: Boolean,
        default: true,
    },
    isPhysicalCardBlockThroughCount: {
        type: Boolean,
        default: false,
    },
    isVirtualCardBlockThroughCount: {
        type: Boolean,
        default: false,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        validate: {
            validator: (v) => EMAIL_REGEX.test(v),
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    address: {
        street_name: {
            type: String,
            required: [true, "Street name is required"],
            max: [100, "Additional info must be less then 100 characters."],
        },
        street_number: {
            type: String,
            default: " ",
            max: [40, "Street number must be less then 40 characters."],
        },
        city: {
            type: String,
            required: [true, "City is required"],
        },
        region: {
            type: String,
            required: [true, "Region is required"],
            trim: true,
        },
        zip_code: {
            type: String,
            required: [true, "Zip code  is required"],
            trim: true,
        },
        country: {
            type: String,
            required: [true, "Country is required"],
            trim: true,
        },
        countryCode: {
            type: String,
            required: [true, "Country code is required"],
            trim: true,
        },
        floor: {
            type: String,
            trim: true,
        },
        apartment: {
            type: String,
            trim: true,
        },
        neighborhood: {
            type: String,
            trim: true,
        },
        additional_info: {
            type: String,
            trim: true,
            min: [3, "Additional info must be of 3 characters."],
            max: [250, "Additional info must be less then 250 characters."],
        },
    },
    cards: [cardSchema],
    disableCards: [cardSchema],
    failedTransactionCount: {
        type: Number,
        default: 0,
    },
    secureData: {
        accessToken: {
            type: String,
            trim: true,
        },
        expiresIn: {
            type: Number,
            trim: true,
        },
        tokenType: {
            type: String,
            trim: true,
        },
        expiryDate: {
            type: Number,
            trim: true,
        },
    },
}, { timestamps: true });

// indexes
Schema.index({ userId: 1 });
Schema.index({ createdAt: -1 });
Schema.index({ pomeloUserId: 1 });

const PomeloUsers = mongoose.model("pomelo_user", Schema);
export default PomeloUsers;
