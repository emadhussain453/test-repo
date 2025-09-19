import keys from "../../../config/keys.js";
import { AppEnviornments, EventTypes, Lenguages, NotificationTitles, NotificationTypes, PomeloCardTypes, StableActiveCountryCodes } from "../../../constants/index.js";
import Event from "../../../Events/databaseLogs.js";
import { translateWithLenguageSpecifiedV1 } from "../../../middlewares/transalations.js";
import PomeloUsers from "../../../models/pomeloUser.js";
import { ApiError } from "../../../utils/ApiError.js";
import saveAndGetuserSecureToken from "../../../utils/pomelo/saveAndGetUserSecureToken.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import signJwtTokenV2 from "../../../utils/signJWTV2.js";

const constructURL = (token) => {
    let url = ``;
    if (process.env.NODE_ENV === AppEnviornments.PRODUCTION) {
        url = `https://api.stable-life.com/api/card/active/success?t=${token}`;
    } else if (process.env.NODE_ENV === AppEnviornments.DEVELOPMENT) {
        url = `https://devapi.stable-life.com/api/card/active/success?t=${token}`;
    } else {
        url = `http://localhost:4500/api/card/active/success?t=${token}`;
        return url;
    }
    return url;
};

const activateCard = async (req, res, next) => {
    try {
        const { user: { _id, country: { countryCode } }, translate } = req;
        const pomeloUser = await PomeloUsers.findOne({ userId: _id });
        if (!pomeloUser) throw new ApiError("invalid requrest", 400, translate("pomelo_user_not_found"), true);

        const cardDetails = pomeloUser.cards.find((card) => card.cardType === PomeloCardTypes.PHYSICAL);
        if (cardDetails?.freezedByAdmin) throw new ApiError("Invalid request", 400, translate("user_card_freezed_by_admin"));
        const secureData = await saveAndGetuserSecureToken(_id);
        const { results: { accessToken } } = secureData;

        const jwtPayload = {
            userId: _id,
        };
        const jwtToken = signJwtTokenV2(jwtPayload, keys.JWT.VERIFY_EMAIL_TOKEN_EXPIRY, keys.JWT.ACTIVATE_CARD_SECRET);
        let makeURLForActivatingCard = `${keys.POMELO.SECURE_DATA_URL}activate-card?auth=${accessToken}&success_link=${constructURL(jwtToken)}`;
        if (countryCode === StableActiveCountryCodes.MEX) makeURLForActivatingCard += `&country=mex`;
        const responsePayload = {
            secureURL: makeURLForActivatingCard,
        };

        return sendSuccessResponse(res, 200, true, translate("secure_url_created_successfully"), "getSecureUrl", responsePayload);
    } catch (error) {
        next(error);
    }
    return false;
};
export default activateCard;
