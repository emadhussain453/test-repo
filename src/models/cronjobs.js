import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: true,
    },
    description: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const CronJobs = mongoose.model("cronjobs", Schema);
export default CronJobs;
