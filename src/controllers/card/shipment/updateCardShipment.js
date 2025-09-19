import callApi from "../../../utils/callApi.js";
import logger from "../../../logger/index.js";
import PomeloUsers from "../../../models/pomeloUser.js";
import { ApiError } from "../../../utils/ApiError.js";
import { EventTypes, Lenguages, NotificationTitles, NotificationTypes, PomeloCardTypes } from "../../../constants/index.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import CheckIfAllRequiredFieldsExists from "../../../utils/checkIfAllRequiredFieldsExists.js";
import { translateWithLenguageSpecifiedV1 } from "../../../middlewares/transalations.js";
import Event from "../../../Events/databaseLogs.js";

const updateCardShipment = async (req, res, next) => {
    try {
        const { translate } = req;
        const { user: { _id, country: { countryCode } }, query: { type = PomeloCardTypes.PHYSICAL }, body: { address } } = req;
        const isCardShipmentUpdateAllowed = true;
        if (isCardShipmentUpdateAllowed) {
            throw new ApiError("validation error", 400, translate("card_sipment_update_not_allowed"), true);
        }
        const addressRequiredFields = ["streetName", "streetNumber", "city", "region", "zipCode", "countryCode"];
        const requiredFieldsExists = CheckIfAllRequiredFieldsExists(address, addressRequiredFields);

        if (!requiredFieldsExists.success) {
            throw new ApiError("validation error", 400, translate("required_fields", { fields: requiredFieldsExists.message }), true);
        }

        const userToOrderCard = await PomeloUsers.findOne({ userId: _id, cards: { $elemMatch: { cardType: PomeloCardTypes.PHYSICAL } } }).lean();
        if (!userToOrderCard) throw new ApiError("validationError", 400, translate("pomelo_user_not_found"), true);

        const cardToGetShipmentFor = userToOrderCard.cards.find((card) => card.cardType === PomeloCardTypes.PHYSICAL);

        const makeAddressObjToUpdate = {
            street_name: address.streetName,
            street_number: address.streetNumber,
            city: address.city,
            region: address.region,
            country: address.countryCode,
        };
        if (address.floor) makeAddressObjToUpdate.floor = address.floor;
        if (address.apartment) makeAddressObjToUpdate.apartment = address.apartment;
        if (address.additionalInfo) makeAddressObjToUpdate.additional_info = address.additionalInfo;

        const updatedAddress = { address: makeAddressObjToUpdate };
        const cardId = `${cardToGetShipmentFor.cardId}/shipment`;
        const updateCardShipmentResp = await callApi.pomelo("pomelo", "cards", "PUT", updatedAddress, cardId, true, false);
        if (!updateCardShipmentResp.success) {
            logger.error(`pomelo :: ${updateCardShipmentResp.message}`);
            throw new ApiError("Pomelo error", updateCardShipmentResp.status, translate("something_went_wrong"), true);
        }
        const { results: { data } } = updateCardShipmentResp;

        // adding zip_code after coz we dont need to send zip_code when creaeting or updating card
        makeAddressObjToUpdate.zip_code = address.zipCode;
        await PomeloUsers.findOneAndUpdate({ userId: _id }, {
            $set: {
                address: makeAddressObjToUpdate,
            },
        }, { new: true });

          // log user notification
          const eventData = {
            userId: _id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("card_shipment_updated_successfully"),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("card_shipment_updated_successfully"),
            title: NotificationTitles.Card_Activity,
            type: NotificationTypes.Card_Activity,
        };
        Event.emit(EventTypes.Notification, eventData);

        return sendSuccessResponse(res, 200, true, translate("card_shipment_updated_successfully"), "cardShipmentUpdated", data);
    } catch (error) {
        next(error);
    }
    return false;
};

export default updateCardShipment;
