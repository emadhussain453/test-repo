/* eslint-disable camelcase */
import mongoose from "mongoose";
import moment from "moment";
import ENV from "../../config/keys.js";
import { ApiError } from "../../utils/ApiError.js";
import sendEmailWithSES from "../../config/sesEmail.js";
import PaymentLinks from "../../models/paymentLinks.js";
import { CountryCurrencies, ExTypes, KushkiWebhookEvents, Lenguages, StableCurrencies, Status } from "../../constants/index.js";
import logger from "../../logger/index.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import Users from "../../models/users.js";
import updateBalance from "../../utils/balanceUpdate.js";
import getStatusHistoryObject from "../../utils/getStatusHistoryObject.js";
import CashinTransactionsV1 from "../../models/transactionsCashinsV1.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import generateUniqueId from "../../utils/generateUniqueId.js";
import capitalizeName from "../../utils/capitalizeName.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import getFeeAndFeeObjectV1 from "../../utils/exchangeRates/getFeeAndObjectV1.js";
import callApi from "../../utils/callApi.js";

async function kushkiPaymentLinkWebHook(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, returnDocument: "after", new: true };
    const time = moment().utc();

    try {
        const { body: { metadata: { smartlinkId, name }, status: event, transactionReference: depositId, processorState: status, amount: { subtotalIva0 }, email } } = req;

        if (!Object.values(KushkiWebhookEvents).includes(event)) return res.status(200).json({ message: "message recieved" });
        if (!Object.values(Status).includes(status.toUpperCase())) throw new ApiError("Invalid Details", 400, "Status is not valid", true);
        const Headers = {
            accept: "application/json",
            "content-type": "application/json",
            "private-merchant-id": ENV.KUSKHI.KUSHKI_PRIVATE_KEY,
        };

        const params = `/${smartlinkId}`;

        const result = await callApi.kushki("kushki", "getPaymentLink", "get", null, params, Headers);

        if (!result.success) {
            logger.error(`kushki error :: ${result.message}`);
            throw new ApiError("Error in kushki Api", 400, ("something_went_wrongsss"), true);
        }

        const paymentLink = await PaymentLinks.findOne({ smartLinkId: smartlinkId, userId: result.results.contact.userId, localAmount: result.results.totalAmount });
        if (!paymentLink) {
            throw new ApiError("not_found", 404, "Payment link not found", true);
        }

        const { userId, _id } = paymentLink;

        if (event !== KushkiWebhookEvents.APPROVED) {
            const statusHistory = {
                status: Status.FAILED,
                time,
            };
            const updateQuery = {
                $set: { status: status.toUpperCase() },
                $push: { statusHistory },
            };

            await PaymentLinks.findOneAndUpdate({ smartLinkId: smartlinkId }, updateQuery, opts);

            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ message: `Transaction has been ${status.toUpperCase()}` }).end();
        }

        const user = await Users.findOne({ _id: userId }).populate({ path: "userBalance", select: "userId balance" });
        if (!user) {
            logger.warn("User not found against this id!");
        }
        if (!user.userBalance) {
            logger.warn("User balance not found");
        }

        const { countryCode } = user.country;
        const exchageRates = await getExchangeRate(CountryCurrencies[countryCode]);
        const oneStableCoin = calculateOneStableCoin(subtotalIva0, paymentLink.amount);

        const feeObject = await getFeeAndFeeObjectV1(paymentLink.amount, "KUSHKI", "CASHIN", "COL");
        const { amount: totalAmountFeeAmount, stableFeeDetuction, serviceFeeDetuction } = feeObject;

        const buyingExchangeRate = exchageRates.buying;
        const stableFeeDetuctionLocal = convertToRequiredDecimalPlaces(stableFeeDetuction * buyingExchangeRate);
        const serviceFeeDetuctionLocal = convertToRequiredDecimalPlaces(serviceFeeDetuction * buyingExchangeRate);
        const localAmount = convertToRequiredDecimalPlaces(totalAmountFeeAmount * buyingExchangeRate);

        const invoiceId = generateUniqueId("kushki");

        const invoivcedata = {
            userId,
            invoiceId,
            depositId,
            amount: paymentLink.amount,
            localAmount: subtotalIva0,
            description: "kushki payment link cashin",
            status: Status.COMPLETED,
            statusHistory: getStatusHistoryObject(Status.COMPLETED, true),
            transactionType: "credit",
            currency: "COP",
            currentExchangeRate: exchageRates,
            fee: {
                ...feeObject,
                oneStableCoin,
                stableFeeDetuctionLocal,
                serviceFeeDetuctionLocal,
                localAmount,
            },
            paymentLinkRefranceId: _id,
        };

        const newInvoice = new CashinTransactionsV1(invoivcedata);
        await newInvoice.save(opts);

        const statusHistory = {
            status: Status.COMPLETED,
            time,
        };

        const updateQuery = {
            $set: { status: Status.COMPLETED },
            $push: { statusHistory },
        };
        await PaymentLinks.findOneAndUpdate({ smartLinkId: smartlinkId }, updateQuery, opts);
        const extraPayload = {};
        const balanceUpdateToUser = user._id;
        await updateBalance(balanceUpdateToUser, paymentLink.amount, extraPayload);

        const date = moment().tz("America/Bogota").format("YYYY-MM-DD");
        const emailtime = moment().tz("America/Bogota").format("HH:mm a");
        const senderFullName = `${capitalizeName(user.firstName)} ${capitalizeName(user.lastName)}`;
        const receiverFullName = `${capitalizeName(name)}`;
        const senderEmailTemplate = user.language === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
        const { language } = user;
        const emailSubject = "Deposit Status Update";

        const PayerEmail = email;
        const emailPayloadForSender = {
            type: language === Lenguages.Spanish ? "Transferir dinero" : "Transfer Money",
            transactionName: "P2P",
            tType: "Cashout",
            amount: convertToRequiredDecimalPlaces(paymentLink.amount, 2),
            localAmount: convertToRequiredDecimalPlaces(subtotalIva0, 2),
            date,
            time: emailtime,
            exchageRate: invoivcedata.currentExchangeRate.buying,
            receiverUserName: capitalizeName(senderFullName),
            fullName: receiverFullName,
        };
        await sendEmailOrMessageV3({ email: PayerEmail, onEmail: true, emailSubject, templates: chooseEmailTemplateAndMessage(senderEmailTemplate, false, emailPayloadForSender) });

        logger.info("**** Balance Updated with exchange rates ****");
        await session.commitTransaction();
        session.endSession();

        return sendSuccessResponse(res, 200, true, "Webhook processed successfully");
    } catch (error) {
        if (process.env.NODE_ENV === "production") await sendEmailWithSES(ENV.DEVELOPER_EMAIL || "munsifalimisri69@gmail.com", "Cashin Error", error);
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default kushkiPaymentLinkWebHook;
