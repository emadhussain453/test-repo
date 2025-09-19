import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    zipcode: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
});

// indexes
Schema.index({ city: 1 });
Schema.index({ state: 1 });

const States = mongoose.model("statesdata", Schema);
export default States;
