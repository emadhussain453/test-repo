import PomeloUsers from "../../models/pomeloUser.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import saveAndGetuserSecureToken from "../../utils/pomelo/saveAndGetUserSecureToken.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const registerToApplePay = async (req, res, next) => {
    try {
        const { user: { _id, country: { countryCode } }, body: { card_id: cardId, user_id: userId }, translate } = req;

        const pomeloUser = await PomeloUsers.findOne({ pomeloUserId: userId });
        if (!pomeloUser) throw new ApiError("Invalid request", 400, translate("pomelo_user_not_found_with_id", { userId }), true);

        const isCard = pomeloUser.cards.find((card) => card.cardId === cardId)?.cardId;
        if (!isCard) throw new ApiError("Invalid request", 400, translate("pomelo_user_doesnt_have_card_cardid", { cardId }), true);

        const cleanPayloadForPomelo = req.body;
        const secureData = await saveAndGetuserSecureToken(_id);
        const { results: { accessToken } } = secureData;
        const userAuthToken = accessToken;
        const isCardRegisteredWithApplePay = await callApi.pomelo("pomelo", "registerToApplePay", "POST", cleanPayloadForPomelo, false, false, userAuthToken);
        if (!isCardRegisteredWithApplePay.success) {
            throw new ApiError("Pomelo error", isCardRegisteredWithApplePay.status, isCardRegisteredWithApplePay.message, true);
        }
        await PomeloUsers.findOneAndUpdate(
            { pomeloUserId: userId, "cards.cardId": cardId },
            { $set: { "cards.$.isCardRegisterWithApplePay": true } },
            { new: true },
        );

        const { results: { data } } = isCardRegisteredWithApplePay;
        return sendSuccessResponse(res, 200, true, translate("pomelo_card_registered_successfully"), "cardRegisteredWithApplePay", data);
    } catch (error) {
        next(error);
    }
    return false;
};
export default registerToApplePay;
