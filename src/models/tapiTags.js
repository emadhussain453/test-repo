import mongoose from "mongoose";

const Schema = mongoose.Schema({
    id: {
        type: Number,
        unique: true,
    },
    name: {
        type: String,
    },
});

const TapiTags = mongoose.model("tapi_tags", Schema);
export default TapiTags;
