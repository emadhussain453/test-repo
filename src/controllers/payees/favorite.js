import Payees from "../../models/payees.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import { Lenguages } from "../../constants/index.js";

const favoritePayee = async (req, res, next) => {
    try {
        const { user: { _id, language: userLangauge }, params: { payeeId } } = req;
        const { translate } = req;

        const language = req.headers["accept-language"] || userLangauge || Lenguages.Spanish;
        if (!payeeId) throw new ApiError("payee error", 400, translate("payee_id_is_required"), true);
        if (!isValidMdbId(payeeId)) throw new ApiError("payee error", 400, translate("payee_invalid_id"), true);

        const query = { _id: payeeId, userId: _id };
        const payeeDetails = await Payees.findOne(query).lean();
        if (!payeeDetails) {
            throw new ApiError("payee error", 400, translate("payee_not_found"), true);
        }
        const favorite = !(payeeDetails.favourite);
        const payee = await Payees.updateOne({ _id: payeeId, userId: _id }, { favourite: favorite });
        if (payee.modifiedCount < 0) {
            throw new ApiError("payee error", 400, translate("payee_updation_error"), true);
        }
        const messages = {
            true: language === Lenguages.English
                ? "Contact has been removed from your favourites."
                : "El contacto ha sido eliminado de tus favoritos.",
            false: language === Lenguages.English
                ? "Contact has been added to your favourites."
                : "El contacto ha sido añadido a tus favoritos.",
        };
        const responseMessage = messages[payeeDetails.favourite];
        return sendSuccessResponse(res, 200, true, responseMessage, "payees");
    } catch (error) {
        next(error);
    }
    return false;
};

export default favoritePayee;
