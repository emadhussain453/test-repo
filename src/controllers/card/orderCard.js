import callApi from "../../utils/callApi.js";
import logger from "../../logger/index.js";
import PomeloUsers from "../../models/pomeloUser.js";
import { ApiError } from "../../utils/ApiError.js";
import { CountryCodes, DocumentTypes, EventTypes, Lenguages, NotificationTitles, NotificationTypes, PomeloCardTypes, ScoreKeys, StableActiveCountryCodes } from "../../constants/index.js";
import KEYS from "../../config/keys.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import getShipmentDetails from "../../utils/pomelo/getShipmentDetails.js";
import cleanUserPayload from "../../utils/pomelo/cleanUserPayload.js";
import Users from "../../models/users.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import capitalizeName from "../../utils/capitalizeName.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import Event from "../../Events/databaseLogs.js";

const orderCard = async (req, res, next) => {
    try {
        const { translate } = req;
        const { user: { _id, email, firstName, userName: name, lastName, country: { countryCode }, kyc }, query: { type = PomeloCardTypes.PHYSICAL } } = req;
        const { user } = req;
        // if (!type) throw new ApiError("invalid requrest", 400, translate("type_required"), true);
        if (!Object.values(PomeloCardTypes).includes(type.toUpperCase())) throw new ApiError("Invalid request", 400, translate("invalid_card_type"), true);
        const cardTypeToOrder = type.toUpperCase() === PomeloCardTypes.VIRTUAL ? PomeloCardTypes.VIRTUAL : PomeloCardTypes.PHYSICAL;

        if (countryCode !== StableActiveCountryCodes.COL && countryCode !== StableActiveCountryCodes.MEX) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }

        if ((user?.kyc?.countryCode !== StableActiveCountryCodes.COL && !user?.kyc.documentType?.startsWith(DocumentTypes.COL.PASSPORT))
            && user?.kyc?.countryCode !== StableActiveCountryCodes.MEX && !user?.kyc.documentType?.startsWith(DocumentTypes.MEX.PASSPORT)) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        const userToOrderCard = await PomeloUsers.findOne({ userId: _id }).populate({ path: "userId", select: "minimumBalance " });
        if (!userToOrderCard) throw new ApiError("validation_error", 400, translate("pomelo_user_not_found"), true);
        // check balance history
        if (userToOrderCard.userId.minimumBalance < 25) throw new ApiError("Invalid Details", 400, translate("low_balance_history"), true);

        const checkIfCardAlreadyExists = await PomeloUsers.findOne({ userId: _id, "cards.cardType": cardTypeToOrder }).select("_id email").lean();
        if (checkIfCardAlreadyExists) {
            throw new ApiError("invalid request", 400, translate("card_already_exists", { cardType: cardTypeToOrder }), true);
        }

        // dont check from kyc.country use country.countryCode
        const PhysicalAffinityGroupId = kyc?.countryCode === StableActiveCountryCodes.MEX ? KEYS.POMELO.MEX_PHYSICAL_AFFINITY_GROUP_ID : KEYS.POMELO.PHYSICAL_AFFINITY_GROUP_ID;
        const VertualAffinityGroupId = kyc?.countryCode === StableActiveCountryCodes.MEX ? KEYS.POMELO.MEX_VIRTUAL_AFFINITY_GROUP_ID : KEYS.POMELO.VIRTUAL_AFFINITY_GROUP_ID;

        const cardPayload = {
            user_id: userToOrderCard.pomeloUserId,
            affinity_group_id: cardTypeToOrder === PomeloCardTypes.PHYSICAL ? PhysicalAffinityGroupId : VertualAffinityGroupId,
            card_type: cardTypeToOrder,
        };

        if (cardTypeToOrder === PomeloCardTypes.PHYSICAL) {
            const fileldsToRemove = ["countryCode"];
            if (countryCode === CountryCodes.COL) fileldsToRemove.push("zip_code");
            const cleanedPayload = cleanUserPayload(fileldsToRemove, userToOrderCard.address.toObject());
            cardPayload.address = cleanedPayload;
        }

        const orderCardPomelo = await callApi.pomelo("pomelo", "cards", "POST", cardPayload, false, true, false);
        if (!orderCardPomelo.success) {
            logger.error(`pomelo :: ${orderCardPomelo.message}`);
            throw new ApiError("pomelo_error", orderCardPomelo.status, translate("something_went_wrong"), true);
        }
        const { results: { data } } = orderCardPomelo;

        const cardObject = {
            cardId: data.id,
            shipmentId: data.shipment_id,
            cardType: data.card_type,
            status: data.status,
            startDate: data.start_date,
            lastFourDigits: data.last_four,
            provider: data.provider,
            productType: data.product_type,
        };

        // if the card type is PHYSICAL, get the shipment details and save
        if (cardTypeToOrder === PomeloCardTypes.PHYSICAL) {
            const shipmentDetails = await getShipmentDetails(data.shipment_id);
            if (shipmentDetails.status === "REJECTED") {
                const shipmentObj = {
                    status: shipmentDetails.status,
                    statusDetail: shipmentDetails.status_detail,
                    shipmentCreatedAt: shipmentDetails.created_at,
                    shipmentType: shipmentDetails.shipment_type,
                };
                cardObject.shipment = shipmentObj;
            } else {
                const shipmentObj = {
                    status: shipmentDetails.status,
                    statusDetail: shipmentDetails.status_detail,
                    shipmentType: shipmentDetails.shipment_type,
                    courier: {
                        company: shipmentDetails.courier.company,
                        trackingURL: shipmentDetails.courier.tracking_url,
                    },
                    shipmentCreatedAt: shipmentDetails.created_at,
                    externalTrackingId: shipmentDetails.external_tracking_id,
                };
                // push the shipment object to card
                cardObject.shipment = shipmentObj;
            }
        }

        userToOrderCard.cards.push(cardObject);
        await userToOrderCard.save();
        const fieldToUpdate = `card.${cardTypeToOrder.toLowerCase()}`;
        await Users.updateOne(
            { _id },
            { $set: { [fieldToUpdate]: true } },
        );

        if (cardTypeToOrder === PomeloCardTypes.VIRTUAL) {
            const cardOrderEmailSubject = translate("order_card_email_subject");
            const cardOrderEmailTemplate = translate("order_card_email_template");
            const userName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
            await sendEmailOrMessageV3({ email, onEmail: true, emailSubject: cardOrderEmailSubject, templates: chooseEmailTemplateAndMessage(cardOrderEmailTemplate, false, { userName }) });
        }
        // log user notification
        const eventData = {
            userId: _id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("card_order_successfully", { cardType: cardTypeToOrder.toLowerCase() }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("card_order_successfully", { cardType: cardTypeToOrder.toLowerCase() }),
            title: NotificationTitles.Card_Activity,
            type: NotificationTypes.Card_Activity,
        };

        Event.emit(EventTypes.Notification, eventData);
        // user score updated
        const code = type.toUpperCase() === PomeloCardTypes.VIRTUAL ? ScoreKeys.ORDER_VIRTUAL_CARD : ScoreKeys.ORDER_PHYSICAL_CARD;
        const scoreData = {
            userId: _id,
            code,
        };
        Event.emit(EventTypes.UpdateUserScore, scoreData);
        return sendSuccessResponse(res, 200, true, translate("card_ordered_successfully", { cardType: cardTypeToOrder }), "orderCard", data);
    } catch (error) {
        next(error);
    }
    return false;
};

export default orderCard;
