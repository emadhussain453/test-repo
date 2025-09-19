import mongoose from "mongoose";
import callApi from "../../utils/callApi.js";
import logger from "../../logger/index.js";
import PomeloUsers from "../../models/pomeloUser.js";
import { ApiError } from "../../utils/ApiError.js";
import { Applications, CountryCodes, CountryCurrencies, DocumentTypes, EventTypes, feeTypes, Lenguages, NotificationTitles, NotificationTypes, PomeloCardBLockStatus, PomeloCardTypes, StableActiveCountryCodes, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
import KEYS from "../../config/keys.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import getShipmentDetails from "../../utils/pomelo/getShipmentDetails.js";
import cleanUserPayload from "../../utils/pomelo/cleanUserPayload.js";
import Users from "../../models/users.js";
import CheckIfAllRequiredFieldsExists from "../../utils/checkIfAllRequiredFieldsExists.js";
import { CreateUserOnPomeloAddressSchema } from "../../constants/joiSchemas.js";
import validateInputs from "../../utils/validateInputs.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import InternalFees from "../../models/internalFees.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import FeeTransactions from "../../models/feeTransactions.js";
import TransactionProfitFee from "../../models/feeTransaction.js";
import ExchangeRates from "../../models/exchangeRates.js";
import capitalizeName from "../../utils/capitalizeName.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import Event from "../../Events/databaseLogs.js";
import Transactions from "../../models/transactions.js";
import updateBalance from "../../utils/balanceUpdate.js";
import calculateExchangeProfit from "../../utils/calculateExchangeProfit.js";
import Wallet from "../../models/feeWallet.js";

const reOrderCard = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };
    try {
        const { user: { _id, email, userBalance, firstName, userName: name, lastName, country: { countryCode }, kyc }, query: { isShippingAddressSame = true } } = req;
        const { body: { address }, user, userIpAddress } = req;
        const { translate } = req;
        if (isShippingAddressSame === "false") {
            const isError = validateInputs(CreateUserOnPomeloAddressSchema, req.body, translate); // returns an object with all the errors
            if (isError) throw new ApiError("Validation error", 400, isError.errorMessage, true);
        }
        const cardTypeToReOrder = PomeloCardTypes.PHYSICAL;
        if (countryCode !== StableActiveCountryCodes.COL && countryCode !== StableActiveCountryCodes.MEX) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }

        if ((user?.kyc?.countryCode !== StableActiveCountryCodes.COL && !user?.kyc.documentType?.startsWith(DocumentTypes.COL.PASSPORT))
            && user?.kyc?.countryCode !== StableActiveCountryCodes.MEX && !user?.kyc.documentType?.startsWith(DocumentTypes.MEX.PASSPORT)) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        const shippingAddressSame = isShippingAddressSame === "true" && true;
        if (!isShippingAddressSame && !address) throw new ApiError("invalid requrest", 400, translate("address_required"), true);

        // check if address fields are proper
        if (!shippingAddressSame) {
            const addressRequiredFields = ["streetName", "city", "region", "zipCode", "country", "countryCode"];
            const requiredFieldsExists = CheckIfAllRequiredFieldsExists(address, addressRequiredFields);
            if (!requiredFieldsExists.success) {
                throw new ApiError("validation error", 400, translate("required_fields", { fields: requiredFieldsExists.message }), true);
            }
        }
        const userToReOrderCard = await PomeloUsers.findOne({ userId: _id }).populate({ path: "userId", select: "minimumBalance" });
        if (!userToReOrderCard) throw new ApiError("validationError", 400, translate("pomelo_user_not_found"), true);
        if (userToReOrderCard.userId.minimumBalance < 25) throw new ApiError("Invalid Details", 400, translate("low_balance_history"), true);
        let reOrderCardFee = 0;
        let feeObject = {};
        if (userToReOrderCard.isReOrderCardFeeCharged) {
            const fee = await InternalFees.findOne({ feeType: feeTypes.REORDER_CARD });
            if (!fee) throw new ApiError("validation error", 400, translate("fee_not_found"), true);
            const exchangeRates = await ExchangeRates.findOne({ currency: CountryCurrencies[countryCode] });
            if (!exchangeRates) throw new ApiError("validation error", 400, translate("exchange_rate_not_found", { currency: CountryCurrencies[countryCode] || "COP" }), true);
            reOrderCardFee = fee.amount;
            reOrderCardFee = convertToRequiredDecimalPlaces(reOrderCardFee);
            if (userBalance.balance < reOrderCardFee) throw new ApiError("validation error", 400, translate("insufficient_balance"), true);
            feeObject = {
                amount: reOrderCardFee,
                feeId: fee._id,
                calculationType: fee.calculationType,
                feeAmountWhenCharged: reOrderCardFee,
                description: fee.description,
            };
            feeObject.oneStableCoin = exchangeRates.selling;
            const localAmount = convertToRequiredDecimalPlaces(reOrderCardFee * exchangeRates.selling);
            const transactiondata = {
                userId: _id,
                amount: reOrderCardFee,
                localAmount,
                userLastBalance: userBalance.balance,
                status: Status.COMPLETED,
                userUpdatedBalance: Number(userBalance.balance - reOrderCardFee),
                fee: feeObject,
                currentExchageRate: exchangeRates,
                feeType: feeTypes.REORDER_CARD,
                userIpAddress,
                metaData: {
                    exRateDifference: 0,
                    exRateProfit: 0,
                    stableFeeDetuction: 0,
                    serviceFeeDetuction: 0,
                    totalProfit: reOrderCardFee,
                },
            };
            const feeTransaction = new FeeTransactions(transactiondata);
            const { _id: tId, localAmount: amountLocal } = feeTransaction;
            // save the trantion in consolidatedTrasntions
            const globalTransTable = {
                transactionRefrenceId: tId,
                userId: _id,
                amount: reOrderCardFee,
                status: Status.COMPLETED,
                transactionModel: StableModelsNames.FEE,
                transactionType: `${TransactionTypes.FEE}`,
                localAmount: amountLocal,
                metaData: {
                    currentExchageRate: exchangeRates,
                    fee: {
                        amount: reOrderCardFee,
                        oneStableCoin: exchangeRates.selling,
                        localAmount: convertToRequiredDecimalPlaces(feeObject.amount * exchangeRates.selling),
                    },
                },
            };
            // before adding create a transaction in the database
            const globalData = new Transactions(globalTransTable);

            // save fee profit amount in seperate transactions
            const feeTransTable = {
                transactionRefrenceId: tId,
                transactionModel: StableModelsNames.FEE,
                amount: reOrderCardFee,
                appType: Applications.STABLE_APP,
                transactionType: TransactionTypes.FEE,
                metaData: {
                    exRateDifference: 0,
                    exRateProfit: 0,
                },
            };
            // before adding create a transaction in the database
            const feeTransTableData = new TransactionProfitFee(feeTransTable);
            await Wallet.updateOne(
                { $inc: { balance: reOrderCardFee } },
            );
            await globalData.save(opts);
            await feeTransaction.save(opts);
            await feeTransTableData.save(opts);
        }

        // TODO: use aggregation to get the single card object from db -- remove loop
        const currentDisabledCard = userToReOrderCard.cards.find((card) => card.cardType === cardTypeToReOrder);

        // get the card status from pomelo
        if (!currentDisabledCard) throw new ApiError("validationError", 400, translate("card_not_found", { cardType: cardTypeToReOrder }), true);
        const { cardId } = currentDisabledCard;

        // check the status of card at pomelo
        const cardStatusResp = await callApi.pomelo("pomelo", "cards", "GET", false, cardId, true, false);
        if (!cardStatusResp.success) {
            logger.error(`pomelo :: ${cardStatusResp.message}`);
            throw new ApiError("Pomelo error", cardStatusResp.status, translate("something_went_wrong"), true);
        }
        const { results: { data: cardStatusOnPomelo } } = cardStatusResp;
        if (cardStatusOnPomelo.status !== PomeloCardBLockStatus.DISABLED) {
            throw new ApiError("invalid request", 400, translate("card_status", { status: cardStatusOnPomelo.status, cardTypeToReOrder }), true);
        }

        // create the new Address if usre is changing his address
        let makeAddressObjForPomelo = {};
        if (!shippingAddressSame) {
            const constructNewAddress = {
                street_name: address.streetName,
                street_number: " ",
                city: address.city,
                region: address.region,
                zip_code: address.zipCode,
                country: address.country,
                countryCode: address.countryCode,
            };
            if (address.floor) constructNewAddress.floor = address.floor;
            if (address.apartment) constructNewAddress.apartment = address.apartment;
            if (address.neighborhood) constructNewAddress.neighborhood = address.neighborhood;
            if (address.additionalInfo) constructNewAddress.additional_info = address.additionalInfo;

            // assign new address
            makeAddressObjForPomelo = {
                ...constructNewAddress,
            };
        }

        const shippingAddressToConsider = shippingAddressSame ? userToReOrderCard.address.toObject() : makeAddressObjForPomelo;
        if (!shippingAddressSame) {
            userToReOrderCard.address = makeAddressObjForPomelo;
            await userToReOrderCard.save(opts);
        }

        let cleanedPayload = shippingAddressToConsider;
        if (countryCode === CountryCodes.COL) {
            const fileldsToRemove = ["zip_code"];
            cleanedPayload = cleanUserPayload(fileldsToRemove, shippingAddressToConsider);
        }
        const PhysicalAffinityGroupId = kyc?.countryCode === StableActiveCountryCodes.COL ? KEYS.POMELO.PHYSICAL_AFFINITY_GROUP_ID : KEYS.POMELO.MEX_PHYSICAL_AFFINITY_GROUP_ID;
        const VertualAffinityGroupId = kyc?.countryCode === StableActiveCountryCodes.COL ? KEYS.POMELO.VIRTUAL_AFFINITY_GROUP_ID : KEYS.POMELO.MEX_VIRTUAL_AFFINITY_GROUP_ID;
        const cardPayload = {
            user_id: userToReOrderCard.pomeloUserId,
            affinity_group_id: cardTypeToReOrder === PomeloCardTypes.PHYSICAL ? PhysicalAffinityGroupId : VertualAffinityGroupId,
            card_type: cardTypeToReOrder,
            address: cleanedPayload,
            previous_card_id: cardId,
        };

        const orderCardPomelo = await callApi.pomelo("pomelo", "cards", "POST", cardPayload, false, true, false);
        if (!orderCardPomelo.success) {
            logger.error(`pomelo :: ${orderCardPomelo.message}`);
            throw new ApiError("Pomelo error", orderCardPomelo.status, translate("something_went_wrong"), true);
        }
        const { results: { data } } = orderCardPomelo;
        const newCardObject = {
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
        if (cardTypeToReOrder === PomeloCardTypes.PHYSICAL) {
            const shipmentDetails = await getShipmentDetails(data.shipment_id);
            if (shipmentDetails.status === "REJECTED") {
                const shipmentObj = {
                    status: shipmentDetails.status,
                    statusDetail: shipmentDetails.status_detail,
                    shipmentCreatedAt: shipmentDetails.created_at,
                    shipmentType: shipmentDetails.shipment_type,
                };
                newCardObject.shipment = shipmentObj;
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
                newCardObject.shipment = shipmentObj;
            }
        }

        // update the card array
        const [addNewCardToCardsArray, cardRemovedAndAddedToDisabledCard] = await Promise.all([
            PomeloUsers.updateOne(
                { userId: _id }, // Remove the matching card from the cards array
                { $push: { cards: newCardObject, disableCards: currentDisabledCard }, $set: { isReOrderCardFeeCharged: true } },
                opts,
            ),
            // if we write both push and pull in same query it will error in confit
            PomeloUsers.updateOne(
                { userId: _id }, // Remove the matching card from the cards array
                { $pull: { cards: { cardId } } },
                opts,
            ),
        ]);

        if (!addNewCardToCardsArray.modifiedCount || !cardRemovedAndAddedToDisabledCard.modifiedCount) {
            throw new ApiError("Server error", 400, "Something went wrong", true);
        }
        const fieldToUpdate = `card.${cardTypeToReOrder.toLowerCase()}`;
        await Users.findOneAndUpdate(
            { _id },
            { $set: { [fieldToUpdate]: true } },
            { opts },
        );

        const extraPayload = {
            opts,
            translate,
        };
        const balanceUpdateToUser = userBalance.userId;
        if (reOrderCardFee > 0) await updateBalance(balanceUpdateToUser, -reOrderCardFee, extraPayload);

        const cardOrderEmailSubject = translate("order_card_email_subject");
        const cardOrderEmailTemplate = translate("order_card_email_template");
        const userName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
        await sendEmailOrMessageV3({ email, onEmail: true, emailSubject: cardOrderEmailSubject, templates: chooseEmailTemplateAndMessage(cardOrderEmailTemplate, false, { userName }) });

        // log user notification
        const eventData = {
            userId: _id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("card_reOrder_successfully", { cardType: cardTypeToReOrder.toLowerCase() }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("card_reOrder_successfully", { cardType: cardTypeToReOrder.toLowerCase() }),
            title: NotificationTitles.Card_Activity,
            type: NotificationTypes.Card_Activity,
        };

        Event.emit(EventTypes.Notification, eventData);
        // commit and end transaction
        await session.commitTransaction();
        session.endSession();
        return sendSuccessResponse(res, 200, true, translate("card_reordered_success", { cardTypeToReOrder }), "cardReOrdered", data);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
};

export default reOrderCard;
