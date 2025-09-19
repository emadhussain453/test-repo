import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError.js";
import logger from "../logger/index.js";
import { EMAIL_REGEX } from "../constants/regex.js";
import passwordValidation from "../utils/passwordValidation.js";
import { Lenguages } from "../constants/index.js";

const Schema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: (v) => EMAIL_REGEX.test(v),
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    totalUsers: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    authentication: { type: Boolean, default: false },
    twofactoreAuthenticationSecret: { type: String },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters long"],
        maxlength: 102,
        trim: true,
        validate: {
            validator: (password) => !(passwordValidation.strength(password) !== true),
            message: (props) => `${props.value} is not a valid password!`,
        },
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ad_users",
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    language: {
        type: String,
        enum: Object.values(Lenguages),
        default: Lenguages.en,
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

// schema methods to campare bcrypt passwords
Schema.methods.bcryptComparePassword = async function comparePassword(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new ApiError("Invalid Details", 500, "Password isn't matching", true);
    }
};

Schema.statics.sanitize = function aanitize() {
    const { password, passCode, createdAt, updatedAt, __v, ...rest } = this.toObject();
    return rest;
};

Schema.pre("save", async function preSave(next) {
    try {
        if (this.isModified("password")) {
            logger.info("password is modified");
            this.password = await bcrypt.hash(this.password, 10);
        }
        next();
    } catch (error) {
        throw new ApiError("Invalid Details", 500, "Password saving failed", true);
    }
});

const Communities = mongoose.model("communities", Schema);

export default Communities;
