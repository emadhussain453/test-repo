import mongoose from "mongoose";
import decimalSchema from "../utils/directa24/decimalSchema.js";

const Schema = new mongoose.Schema({
    currencyId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    auto: {
        type: Boolean,
        default: false,
        require: true,
    },
    amountIncToBuying: decimalSchema(true, true),
    amountDecToSelling: decimalSchema(true, true),
}, {
    timestamps: true,
    toJSON: { getters: true, setter: true },
    toObject: { getters: true, setters: true },
    runSettersOnQuery: true,
});
Schema.index({ auto: 1 });
Schema.index({ currencyId: 1 });

const AutoExchanges = mongoose.model("autoExchanges", Schema);

export default AutoExchanges;
