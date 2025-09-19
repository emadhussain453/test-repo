import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import Users from "../../models/users.js";

const saveIdNumber = async (req, res, next) => {
    try {
        const { idNumber } = req.body;
        const { user, translate } = req;

        await Users.updateOne({ _id: user._id }, { $set: { "kyc.orignalDocumentNumber": idNumber } });
        return sendSuccessResponse(res, 200, true, translate("idnumber_saved_successfully"), "idNumber");
    } catch (error) {
        next(error);
    }
    return false;
};

export default saveIdNumber;
