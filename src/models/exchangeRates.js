import mongoose from "mongoose";
import { StableCurrencies } from "../constants/index.js";
import decimalSchema from "../utils/directa24/decimalSchema.js";

const Schema = new mongoose.Schema({
    currency: {
        type: String,
        required: [true, "Currency is required."],
        // unique: true,
        enums: Object.keys(StableCurrencies),
    },
    buying: decimalSchema(true, true),
    selling: decimalSchema(true, true),
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});

const ExchangeRates = mongoose.model("exchangerates", Schema);

export default ExchangeRates;
export { Schema as ExchageSchema };
