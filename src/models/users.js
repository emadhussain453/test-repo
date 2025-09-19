import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { RoleTypes, Flags, Lenguages, CountryCodes, StableActiveCountryCodes, FlagsWithColor } from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";
import print from "../utils/print.js";
import logger from "../logger/index.js";
import { COLOMBIAN_PHONE_NUMBER_REGEX, EMAIL_REGEX, NAME_REGEX, PASS_CODE_REGEX, USERNAME_REGEX } from "../constants/regex.js";
import passwordValidation from "../utils/passwordValidation.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";

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
    userName: {
        type: String,
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [15, "Username must be at least 15 characters long]"],
        trim: true,
        validate: {
            validator: (v) => USERNAME_REGEX.test(v),
            message: (props) => `${props.value} is not a valid username!`,
        },
    },
    dateOfBirth: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters long"],
        maxlength: 102,
        trim: true,
        // validate: {
        //     validator: (password) => !(passwordValidation.strength(password) !== true),
        //     message: (props) => `${props.value} is not a valid password!`,
        // },
        // select: false,
    },
    passCode: {
        type: String,
        // validate: {
        //     validator: (passcode) => PASS_CODE_REGEX.test(passcode), // Ensure passcode is exactly 4 digits,
        //     message: (props) => `${props.value} is not a valid passcode. Passcode must be exactly 4 digits.`,
        // },
    },
    phoneNumber: {
        type: String,
        required: [true, "Mobile number is required"],
        unique: true,
        trim: true,
        // validate: {
        //     validator: (v) => COLOMBIAN_PHONE_NUMBER_REGEX.test(v),
        //     message: (props) => `${props.value} is not a valid mobile number! like +57xxxxxxxxxx`,
        // },
    },
    balance: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        required: true,
        min: [0, "Balance can't be negative"],
        get: (balance) => parseFloat(parseFloat(balance.toString()).toFixed(4)),
        set: (balance) => parseFloat(balance.toString()).toFixed(4),
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    mobileVerified: {
        type: Boolean,
        default: false,
    },
    kycStatus: {
        type: Number,
        default: 0,
        enum: [0, 1, 2, 3, 4, 5],
    },
    role: {
        type: String,
        enum: Object.values(RoleTypes),
        default: RoleTypes.USER,
        required: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: Number,
    },
    otpExpiry: {
        type: Number,
        default: null,
    },
    otpExpiryInSeconds: {
        type: Number,
        default: null,
    },
    otpType: {
        type: String,
        default: null,
    },
    otpVerified: {
        type: Boolean,
        default: false,
    },
    devices: [
        {
            notificationToken: {
                type: String,
                default: null,
                trim: true,
            },
            notificationStatus: {
                type: Boolean,
                default: true,
            },
            loginStatus: {
                type: Boolean,
                default: true,
            },
            isMainDevice: {
                type: Boolean,
                default: false,
            },
            deviceModel: {
                type: String,
                trim: true,
            },
            deviceOS: {
                type: String,
                trim: true,
            },
            deviceId: {
                type: String,
                trim: true,
            },
            lastLoginAt: {
                type: Date,
                trim: true,
            },
        },
    ],
    notificationCount: {
        type: Number,
        default: 0,
    },
    kyc: {
        documentType: {
            type: String,
            trim: true,
        },
        documentIdNumber: {
            type: String,
            trim: true,
        },
        orignalDocumentNumber: {
            type: String,
            trim: true,
        },
        countryCode: {
            type: String,
            trim: true,
        },
        d24DocumentType: {
            type: String,
            trim: true,
        },
        d24CountryCode: {
            type: String,
            trim: true,
        },
        pomeloDocumentType: {
            type: String,
            trim: true,
        },
    },
    deleteInfo: {
        reason: {
            type: String,
        },
        comment: {
            type: String,
        },
    },
    address: {
        street: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        zipCode: {
            type: String,
            trim: true,
        },
    },
    country: {
        country: {
            type: String,
            default: CountryCodes.COL,
            trim: true,
        },
        countryCode: {
            type: String,
            default: StableActiveCountryCodes.COL,
            trim: true,
        },
    },
    ip: {
        type: String,
        trim: true,
    },
    sourceId: {
        type: String,
        trim: true,
    },
    flag: { type: Number, default: FlagsWithColor.GREEN },
    kycAttempts: { type: Number, default: 0 },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    gender: {
        type: String,
        trim: true,
    },
    kycVerifiedAt: {
        type: Date,
        trim: true,
    },
    contacts: {
        type: Array,
    },
    language: {
        type: String,
        enum: Object.values(Lenguages),
        default: Lenguages.en,
        // required: true,
    },
    tokenVersion: {
        type: Number,
        default: 0,
    },
    score: {
        type: Number,
        default: 0,
    },
    refreshToken: {
        type: String,
    },
    avatar: {
        url: {
            type: String,
            default: null,
        },
        s3Url: String,
        key: String,
        uploadedAt: Date,
        blurHash: String,
    },
    hubspot: {
        userId: String,
        lifeCycleStage: [
            {
                stage: String,
                createdAt: Date,
            },
        ],
    },
    kycvfotu: Boolean,
    card: {
        virtual: {
            type: Boolean,
            default: false,
        },
        physical: {
            type: Boolean,
            default: false,
        },
    },
    isUserAbleToOrderCard: {
        type: Boolean,
        default: false,
    },
    userBalance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_balance",
    },
    softBlock: {
        status: Boolean,
        key: String,
        reason: String,
    },
    tutorial: {
        home: {
            type: Boolean,
            default: false,
        },
        account: {
            type: Boolean,
            default: false,
        },
        cards: {
            type: Boolean,
            default: false,
        },
    },
    minimumBalance: decimalSchema(false, true),
    termsAndConditions: {
        type: Boolean,
        default: true,
    },
    bankStatementVerification: {
        type: Boolean,
        default: false,
    },
    statementVerifiedAt: {
        type: Date,
        trim: true,
    },
    isBankStatementUploaded: {
        type: Boolean,
        default: false,
    },
    isUserHaveToUploadBankStatement: {
        type: Boolean,
        default: false,
    },
    fraudDetection: {
        softBlock: {
            type: Boolean,
            default: false,
        },
        reason: String,
    },
    onepayCustomerId: {
        type: String,
    },
    aiPraise: {
        verificationSessionId: String,
        profileId: String,
        status: String,
        message: String,
    },
    aiPriseAdditionalDocument: {
        verificationSessionId: String,
        fileId: String,
        status: String,
        stableStatus: String,
    },
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

// indexing
Schema.index({ createdAt: -1 });
Schema.index({ kycVerifiedAt: -1 });
Schema.index({ "kyc.documentIdNumber": 1 });
Schema.index({ minimumBalance: -1 });

// schema methods to campare bcrypt passwords
Schema.methods.bcryptComparePassword = async function comparePassword(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new ApiError("Invalid Details", 500, "Password isn't matching", true);
    }
};
Schema.methods.bcryptComparePassCode = async function comparePassword(passCode) {
    try {
        return await bcrypt.compare(passCode, this.passCode);
    } catch (error) {
        throw new ApiError("Invalid Details", 500, "Passcode isn't matching", true);
    }
};

Schema.statics.sanitize = function aanitize() {
    const { password, passCode, createdAt, updatedAt, __v, ...rest } = this.toObject();
    return rest;
};

Schema.pre("save", async function preSave(next) {
    try {
        if (this.isModified("password")) {
            this.password = await bcrypt.hash(this.password, 10);
        }
        if (this.isModified("passCode")) {
            this.passCode = await bcrypt.hash(this.passCode, 10);
        }
        next();
    } catch (error) {
        throw new ApiError("Invalid Details", 500, "Password or passCode saving failed", true);
    }
});

const Users = mongoose.model("users", Schema);

export default Users;
