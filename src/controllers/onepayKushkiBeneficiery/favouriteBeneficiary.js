import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import { Lenguages } from "../../constants/index.js";
import OnepayKushkBenefeciery from "../../models/onepayKushkiCashoutBenefeciary.js";

const favoriteBeneficiary = async (req, res, next) => {
    try {
        const { user: { _id, language: userLangauge }, query: { beneficiaryId } } = req;
        const { translate } = req;

        const language = req.headers["accept-language"] || userLangauge || Lenguages.Spanish;
        if (!isValidMdbId(beneficiaryId)) throw new ApiError("Invalid details", 400, translate("invalid_md_id", { name: "beneficiaryId" }), true);

        const query = { _id: beneficiaryId, userId: _id, isDeleted: false };
        const payeeDetails = await OnepayKushkBenefeciery.findOne(query).lean();
        if (!payeeDetails) {
            throw new ApiError("payee error", 400, translate("payee_not_found"), true);
        }
        const favorite = !(payeeDetails.favourite);
        const payee = await OnepayKushkBenefeciery.updateOne({ _id: beneficiaryId, userId: _id }, { favourite: favorite });
        if (payee.modifiedCount < 0) {
            throw new ApiError("payee error", 400, translate("payee_updation_error"), true);
        }
        const messages = {
            true: language === Lenguages.English
                ? "Beneficiary has been removed from your favourites."
                : "El contacto ha sido eliminado de tus favoritos.",
            false: language === Lenguages.English
                ? "Beneficiary has been added to your favourites."
                : "El contacto ha sido añadido a tus favoritos.",
        };
        const responseMessage = messages[payeeDetails.favourite];
        return sendSuccessResponse(res, 200, true, responseMessage, "payees");
    } catch (error) {
        next(error);
    }
    return false;
};

export default favoriteBeneficiary;
