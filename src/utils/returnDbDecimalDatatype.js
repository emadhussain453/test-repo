import mongoose from "mongoose";

const returnDecimalType = (fieldName, isFieldRequired) => {
    const obj = {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0.0000"),
        get: (amount) => parseFloat(parseFloat(amount.toString()).toFixed(4)),
        set: (amount) => parseFloat(amount.toString()).toFixed(4),
    };

    if (isFieldRequired) obj.required = [true, `${fieldName} is required.`];
    return obj;
};

export default returnDecimalType;
