import mongoose from "mongoose";

const kushkiBankListSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        unique: true,
    },

}, { timestamps: true });

const KushkiBankList = mongoose.model("kushki_bank_lists", kushkiBankListSchema);

export default KushkiBankList;
