import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    version: {
        type: String,
        required: true,
    },
});

// indexes
Schema.index({ version: 1 });

const AppDetails = mongoose.model("app_version", Schema);
export default AppDetails;
