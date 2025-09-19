import mongoose from "mongoose";

const isValidMdbId = (id) => {
    try {
        const isValid = mongoose.isValidObjectId(id);
        return isValid;
    } catch (error) {
        throw new Error(error.message);
    }
};
export default isValidMdbId;
