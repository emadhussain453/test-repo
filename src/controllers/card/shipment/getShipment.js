import PomeloUsers from "../../../models/pomeloUser.js";
import { ApiError } from "../../../utils/ApiError.js";
import { PomeloCardTypes } from "../../../constants/index.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import getShipmentDetails from "../../../utils/pomelo/getShipmentDetails.js";

const getShipment = async (req, res, next) => {
    try {
        const { user: { _id, country: { countryCode } }, query: { type = PomeloCardTypes.PHYSICAL } } = req;
        const { translate } = req;
        const userToOrderCard = await PomeloUsers.findOne({ userId: _id, cards: { $elemMatch: { cardType: PomeloCardTypes.PHYSICAL } } }).lean();
        if (!userToOrderCard) throw new ApiError("validationError", 400, translate("pomelo_user_not_found"), true);
        const cardToGetShipmentFor = userToOrderCard.cards.find((card) => card.cardType === PomeloCardTypes.PHYSICAL);
        const shipmentDetails = await getShipmentDetails(cardToGetShipmentFor.shipmentId);

        await PomeloUsers.findOneAndUpdate({ userId: _id, "cards.cardType": PomeloCardTypes.PHYSICAL }, {
            $set: {
                "cards.$.shipment.status": shipmentDetails.status,
                "cards.$.shipment.statusDetail": shipmentDetails?.status_detail,
                "cards.$.shipment.externalTrackingId": shipmentDetails?.external_tracking_id,
            },
        }, { new: true });
        return sendSuccessResponse(res, 200, true, translate("card_shipment_fetched", { cardType: type }), "cardShipment", shipmentDetails);
    } catch (error) {
        next(error);
    }
    return false;
};

export default getShipment;
