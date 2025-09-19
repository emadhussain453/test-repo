import mongoose from "mongoose";

const decimalSchema = (isRequired = false, isDefault = true) => {
    const schema = {
        type: mongoose.Schema.Types.Decimal128,
        get: (amount = "0.0000") => parseFloat(parseFloat(amount.toString()).toFixed(4)),
        set: (amount = "0.0000") => parseFloat(amount.toString()).toFixed(4),
    };
    if (isDefault) {
        schema.default = mongoose.Types.Decimal128.fromString("0.0000");
    }
    if (isRequired) {
        schema.required = [true];
    }
    return schema;
};
export default decimalSchema;
