import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    status: {
        default: true,
        type: Boolean,
    },
    metadata: {
        action: {
            type: String,
            default: "allowOnInvalid",
            enums: ["allowOnInvalid", "blockOnInvalid"],
        },
    },
});

// indexes
Schema.index({ name: 1 }, { unique: 1 });

const ApiConfigurations = mongoose.model("api_configuration", Schema);
export default ApiConfigurations;
