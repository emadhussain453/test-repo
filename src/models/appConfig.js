import mongoose from "mongoose";
import { FlagsWithColor } from "../constants/index.js";

const transactionLimitsSchema = new mongoose.Schema(
    {
        cashin: {
            minLimit: {
                type: Number,
                required: true,
                default: 0,
                validate: {
                    validator(value) {
                        return value >= 0; // Must be non-negative
                    },
                    message: "CASHIN minLimit must be non-negative.",
                },
            },
            verificationRequiredLimit: {
                type: Number,
            },
            dailyVerificationRequiredLimit: {
                type: Number,
            },
            maxCashInTransactions: {
                type: Number,
                default: 4,
            },
            durationInHoursToCheckTransactions: {
                type: Number,
                default: 4,
            },
            serviceThreshold: {
                type: Number,
                default: 100,
            },
            checkDays: {
                type: Number,
            },
            maxLimit: {
                type: Number,
                required: true,
                validate: {
                    validator(value) {
                        return value > this.cashin.minLimit;
                    },
                    message: "CASHIN maxLimit must be greater than minLimit.",
                },
            },
        },
        cashout: {
            minLimit: {
                type: Number,
                required: true,
                default: 0,
                validate: {
                    validator(value) {
                        return value >= 0;
                    },
                    message: "CASHOUT minLimit must be non-negative.",
                },
            },
            maxLimit: {
                type: Number,
                required: true,
                validate: {
                    validator(value) {
                        return value > this.cashout.minLimit;
                    },
                    message: "CASHOUT maxLimit must be greater than minLimit.",
                },
            },
            serviceThreshold: {
                type: Number,
                default: 100,
            },
        },
        flag: {
            type: Number,
            default: FlagsWithColor.ORANGE,
        },
        isNewAppShow: {
            type: Boolean,
            default: false,
        },
        maintenance: {
            isScheduled: {
                type: Boolean,
                default: false,
            },
            description: {
                en: {
                    type: String,
                    required: false,
                },
                es: {
                    type: String,
                    required: false,
                },
            },
        },
        fraudDetection: {
            durationMinutes: {
                type: Number,
                default: 30,
                min: 1,
            },
            percentageThreshold: {
                type: Number,
                default: 80,
                min: 0,
                max: 100,
            },
            highCashinAmountToCheck: {
                type: Number,
                default: 1000,
            },
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true, setter: true },
        toObject: { getters: true, setters: true },
        runSettersOnQuery: true,
    },
);

const AppConfig = mongoose.model("appConfig", transactionLimitsSchema);

export default AppConfig;
