import keys from "../../../config/keys.js";
import { PomeloCardTypes } from "../../../constants/index.js";
import logger from "../../../logger/index.js";
import PomeloUsers from "../../../models/pomeloUser.js";
import { ApiError } from "../../../utils/ApiError.js";
import saveAndGetuserSecureToken from "../../../utils/pomelo/saveAndGetUserSecureToken.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";

const makeQueryString = (details = []) => {
    let str = "";
    for (let i = 0; i < details.length; i++) {
        str += `&field_list=${details[i]}`;
    }
    return str;
};
const viewCardDetail = async (req, res, next) => {
    try {
        const { user: { _id, country: { countryCode } }, query: { type }, translate } = req;
        // if (!type) throw new ApiError("invalid requrest", 400, translate("type_required"), true);
        const cardTypeToViewDetails = type.toUpperCase() === PomeloCardTypes.VIRTUAL ? PomeloCardTypes.VIRTUAL : PomeloCardTypes.PHYSICAL;
        if (!Object.values(PomeloCardTypes).includes(type.toUpperCase())) throw new ApiError("Invalid request", 400, translate("invalid_card_type"), true);
        const pomeloUser = await PomeloUsers.findOne({ userId: _id });
        if (!pomeloUser) throw new ApiError("invalid requrest", 400, translate("pomelo_user_not_found"), true);

        const cardDetails = pomeloUser.cards.find((card) => card.cardType === cardTypeToViewDetails);

        if (!cardDetails) {
            throw new ApiError("Invalid request", 400, translate("card_type_not_found", { cardType: cardTypeToViewDetails }));
        }

        if (cardDetails?.freezedByAdmin) throw new ApiError("Invalid request", 400, translate("user_card_freezed_by_admin"));
        const detailsToGetOnData = ["pan", "code", "pin", "name", "expiration"];
        const query = makeQueryString(detailsToGetOnData);
        const secureData = await saveAndGetuserSecureToken(_id);

        if (!secureData.success) {
            logger.error(`pomelo :: ${secureData.message}`);
            throw new ApiError("Invalid request", 400, translate("something_went_wrong"), true);
        }
        const { results: { accessToken } } = secureData;
        const makeURLForActivatingCard = `${keys.POMELO.SECURE_DATA_URL}${cardDetails.cardId}?auth=${accessToken}${query}`;
        const responsePayload = {
            secureURL: makeURLForActivatingCard,
        };

        return sendSuccessResponse(res, 200, true, translate("secure_url_created_successfully"), "getSecureUrl", responsePayload);
    } catch (error) {
        next(error);
    }
    return false;
};
export default viewCardDetail;
