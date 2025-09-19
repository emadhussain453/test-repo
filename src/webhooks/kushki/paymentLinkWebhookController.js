/* eslint-disable camelcase */
import mongoose from "mongoose";
import moment from "moment";
import ENV from "../../config/keys.js";
import { ApiError } from "../../utils/ApiError.js";
import sendEmailWithSES from "../../config/sesEmail.js";
import PaymentLinks from "../../models/paymentLinks.js";
import { Applications, CountryCurrencies, EventTypes, ExTypes, KushkiWebhookEvents, Lenguages, NotificationPriority, NotificationTitles, NotificationTypes, ScoreKeys, StableCurrencies, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
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
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import Event from "../../Events/databaseLogs.js";
import ScoreHistory from "../../models/scoreHistory.js";
import Transactions from "../../models/transactions.js";
import calculateExchangeProfit from "../../utils/calculateExchangeProfit.js";
import FeeTransactions from "../../models/feeTransaction.js";
import getAppConfig from "../../utils/getAppConfig.js";
import getUserCashinVolume from "../../utils/getUserCashinVolume.js";

const sendNotificationHelper = async (userData, payloadForPushNotification) => {
    try {
        const userActiveNotificationToken = activeNotificationTokenOfUser(userData.devices);
        await notificationsQueue.add("pushNotification", {
            title: userData.title,
            message: await translateWithLenguageSpecifiedV1(userData.language)(userData.message, { amountToUpdated: Number(payloadForPushNotification.amount).toFixed(2) }),
            tokens: userActiveNotificationToken,
            additionalDetails: payloadForPushNotification,
        }, { priority: NotificationPriority.TWO });
    } catch (error) {
        throw new Error(error.message);
    }
};

async function kushkiPaymentLinkWebHookHandler(job, done) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, returnDocument: "after", new: true };
    const time = moment().utc();

    try {
        const { smartLinkId, status, transactionReference, bankName, name, email } = job.data;

        const Headers = {
            accept: "application/json",
            "content-type": "application/json",
            "private-merchant-id": ENV.KUSKHI.KUSHKI_PRIVATE_KEY,
        };

        const params = `/${smartLinkId}`;

        const result = await callApi.kushki("kushki", "getPaymentLink", "get", null, params, Headers);

        if (!result.success) {
            logger.error(`kushki error :: ${result.message}`);
            throw new ApiError("Error in kushki Api", 400, ("something_went_wrongsss"), true);
        }

        const paymentLink = await PaymentLinks.findOne({ smartLinkId, userId: result.results.contact.userId, localAmount: result.results.totalAmount });
        if (!paymentLink) {
            throw new ApiError("not_found", 404, "Payment link not found", true);
        }
        if (paymentLink.status === Status.COMPLETED) {
            logger.info(`Transaction ${transactionReference} is already completed`);
            return done(null, { message: "Transaction already completed" });
        }

        const { userId, _id, exchageRates, fee } = paymentLink;

        const user = await Users.findOne({ _id: userId }).populate({ path: "userBalance", select: "userId balance" }).lean();
        if (!user) {
            logger.warn("User not found against this id!");
        }
        if (!user.userBalance) {
            logger.warn("User balance not found");
        }
        const title = user.language === "es" ? "Recarga " : "Money added ";
        if (status !== KushkiWebhookEvents.APPROVED) {
            const statusHistory = {
                status: Status.FAILED,
                time,
            };
            const updateQuery = {
                $set: { status: Status.FAILED },
                $push: { statusHistory },
            };

            await PaymentLinks.findOneAndUpdate({ smartLinkId }, updateQuery, opts);

            const userActiveNotificationToken = activeNotificationTokenOfUser(user.devices);
            await notificationsQueue.add("pushNotification", {
                title,
                message: await translateWithLenguageSpecifiedV1(user.language)("payment_failed_response", { amount: convertToRequiredDecimalPlaces(paymentLink.amount, 2) }),
                tokens: userActiveNotificationToken,
            }, { priority: NotificationPriority.TWO });

            // Log notification event
            const eventData = {
                userId,
                message: await translateWithLenguageSpecifiedV1(Lenguages.English)("payment_failed_response", { amount: convertToRequiredDecimalPlaces(paymentLink.amount, 2) }),
                spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("payment_failed_response", { amount: convertToRequiredDecimalPlaces(paymentLink.amount, 2) }),
                title: NotificationTitles.Payment_Confirmation,
                type: NotificationTypes.PaymentConfirmation,
            };
            Event.emit(EventTypes.Notification, eventData);

            await session.commitTransaction();
            session.endSession();
            return done(null, { message: `Transaction marked as ${Status.FAILED}` });
        }

        const feeObject = await getFeeAndFeeObjectV1(paymentLink.amount, "KUSHKI", "CASHIN", "COL");
        const { amount: totalAmountFeeAmount } = feeObject;

        const invoiceId = generateUniqueId("kushki");
        const currencyId = exchageRates._id;
        const exRate = exchageRates.buying;
        const finalAmount = Number(totalAmountFeeAmount + paymentLink.amount) || 0;
        const calculateExRateProfit = await calculateExchangeProfit(
            currencyId,
            finalAmount,
            exRate,
            "amountIncToBuying",
            totalAmountFeeAmount || 0,
        );

        const metaData = {
            exRateDifference: calculateExRateProfit.amountToDeduct,
            exRateProfit: calculateExRateProfit.exRateProfit,
            totalProfit: calculateExRateProfit.totalProfit,
        };

        const lastBalance = Number(user.userBalance.balance.toString());
        const paymentType = bankName;
        const invoivcedata = {
            userId,
            invoiceId,
            depositId: transactionReference,
            amount: paymentLink.amount,
            localAmount: result.results.totalAmount,
            description: "kushki payment link cashin",
            status: Status.COMPLETED,
            statusHistory: getStatusHistoryObject(Status.COMPLETED, true),
            transactionType: "credit",
            userLastBalance: lastBalance,
            userUpdatedBalance: lastBalance + paymentLink.amount,
            currency: "COP",
            currentExchangeRate: exchageRates,
            metaData,
            fee,
            paymentInfo: {
                type: paymentType,
                method: paymentType,
                methodName: paymentType,
            },
            paymentLinkRefranceId: _id,
        };

        const newInvoice = new CashinTransactionsV1(invoivcedata);

        const { _id: tId } = newInvoice;
        // save the trantion in consolidatedTrasntions
        const globalTransTable = {
            transactionRefrenceId: tId,
            userId: user._id,
            amount: paymentLink.amount,
            status: Status.COMPLETED,
            transactionModel: StableModelsNames.CASHIN_V1,
            transactionType: `${TransactionTypes.Cashin}|${bankName}`,
            localAmount: result.results.totalAmount,
            metaData: {
                currentExchageRate: exchageRates,
                fee: {
                    amount: fee.amount,
                    localAmount: fee.localAmount,
                    oneStableCoin: fee.oneStableCoin,
                    serviceFee: feeObject.serviceFeeDetuction,
                    stableFee: feeObject.stableFeeDetuction,
                },
            },
        };
        // before adding create a transaction in the database
        const globalData = new Transactions(globalTransTable);

        const feeTransTable = {
            transactionRefrenceId: tId,
            transactionModel: StableModelsNames.CASHIN_V1,
            amount: calculateExRateProfit.totalProfit,
            appType: Applications.STABLE_APP,
            transactionType: `${TransactionTypes.cashin}`,
            metaData: {
                exRateDifference: calculateExRateProfit.amountToDeduct,
                exRateProfit: calculateExRateProfit.exRateProfit,
                stableFeeDetuction: invoivcedata.fee.stableFeeDetuction,
                serviceFeeDetuction: invoivcedata.fee.serviceFeeDetuction,
            },
        };

        const feeTransTableData = new FeeTransactions(feeTransTable);
        await newInvoice.save(opts);
        await globalData.save(opts);
        await feeTransTableData.save(opts);

        const statusHistory = {
            status: Status.COMPLETED,
            time,
        };

        const updateQuery = {
            $set: { status: Status.COMPLETED },
            $push: { statusHistory },
        };
        await PaymentLinks.findOneAndUpdate({ smartLinkId }, updateQuery, opts);
        const extraPayload = {};
        const balanceUpdateToUser = user._id;
        await updateBalance(balanceUpdateToUser, paymentLink.amount, extraPayload);

        if (user.minimumBalance < 50) {
            try {
                await Users.updateOne({ _id: user._id }, { $inc: { minimumBalance: paymentLink.amount } });
            } catch (error) {
                logger.error(`Error in updating minimumBalance value  error :: ${error}`);
            }
        }
        try {
            const checkIfFirstCashin = await ScoreHistory.findOne({ userId, code: ScoreKeys.FIRST_CASHIN });
            if (!checkIfFirstCashin) {
                // update user score
                const scoreData = {
                    userId,
                    code: ScoreKeys.FIRST_CASHIN,
                };
                Event.emit(EventTypes.UpdateUserScore, scoreData);
            }
        } catch (error) {
            logger.error(`error in update user score`);
        }
        const currency = CountryCurrencies[user?.country?.countryCode];
        const date = moment().tz("America/Bogota").format("DD-MM-YYYY");
        const emailtime = moment().tz("America/Bogota").format("HH:mm a");
        const senderFullName = `${capitalizeName(user.firstName)} ${capitalizeName(user.lastName)}`;
        const receiverFullName = `${capitalizeName(name)}`;
        const senderEmailTemplate = user.language === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
        const { language } = user;
        const emailSubject = language === Lenguages.Spanish ? "Transferir dinero" : "Transfer Money";

        const PayerEmail = email;
        const emailPayloadForSender = {
            type: language === Lenguages.Spanish ? "Transferir dinero" : "Transfer Money",
            transactionName: "P2P",
            tType: "cashout",
            amount: convertToRequiredDecimalPlaces(paymentLink.amount, 2),
            localAmount: convertToRequiredDecimalPlaces(result.results.totalAmount, 0),
            date,
            time: emailtime,
            exchageRate: convertToRequiredDecimalPlaces(newInvoice.fee.oneStableCoin, 0),
            receiverUserName: capitalizeName(senderFullName),
            fullName: receiverFullName,
            currency,
        };
        await sendEmailOrMessageV3({ email: PayerEmail, onEmail: true, emailSubject, templates: chooseEmailTemplateAndMessage(senderEmailTemplate, false, emailPayloadForSender) });

        // email send to user
        const { firstName, lastName } = user;
        const movementEmailTemplate = language === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;

        const userEmailPayload = { type: language === Lenguages.Spanish ? "Recarga" : "Money added", tType: "cashin", amount: paymentLink.amount, localAmount: convertToRequiredDecimalPlaces(result.results.totalAmount, 0), date, time: emailtime, exchageRate: convertToRequiredDecimalPlaces(newInvoice.fee.oneStableCoin, 0), fullName, currency };
        await sendEmailOrMessageV3({ email: user.email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Recarga" : "Money added", templates: chooseEmailTemplateAndMessage(movementEmailTemplate, false, userEmailPayload) });

        const payloadForPushNotification = {
            notificationType: NotificationTypes.PaymentConfirmation,
            _id: newInvoice._id,
            userId: user._id,
            depositId: newInvoice.depositId,
            cashinSuccess: true,
            status: Status.COMPLETED,
            amount: newInvoice.amount,
            localAmount: newInvoice.localAmount,
            currency: StableCurrencies[newInvoice.currency],
            createdAt: newInvoice.createdAt,
            oneStableCoin: newInvoice.fee.oneStableCoin,
            currentExchangeRate: exchageRates,
            tType: "cashin",
            type: "cashin",
        };

        const userData = {
            devices: user.devices,
            language: user.language,
        };
        // now send push notification to user
        userData.title = title;
        userData.message = "cashin_success_push_notification_message";
        await sendNotificationHelper(userData, payloadForPushNotification);

        // log user notification
        const eventData = {
            userId: user._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("cashin_success_push_notification_message", { amountToUpdated: convertToRequiredDecimalPlaces(paymentLink.amount, 2) }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("cashin_success_push_notification_message", { amountToUpdated: convertToRequiredDecimalPlaces(paymentLink.amount, 2) }),
            title: NotificationTitles.Payment_Confirmation,
            type: NotificationTypes.PaymentConfirmation,
        };
        Event.emit(EventTypes.Notification, eventData);

        logger.info("**** Balance Updated with exchange rates ****");
        await session.commitTransaction();
        session.endSession();

        try {
            const app = await getAppConfig();
            if (!app) throw new ApiError("App config not found", 400, "App config not found", true);
            const { bankStatementVerification, isUserHaveToUploadBankStatement, isBankStatementUploaded } = userId;
            if (!bankStatementVerification && !isUserHaveToUploadBankStatement && !isBankStatementUploaded) {
                const { cashin: { checkDays, verificationRequiredLimit = 1400, dailyVerificationRequiredLimit = 1000 } } = app;
                const oneDayVolume = await getUserCashinVolume(userId._id, 0);
                const multiDayVolume = oneDayVolume < dailyVerificationRequiredLimit
                    ? await getUserCashinVolume(userId._id, checkDays)
                    : null;
                const needsUpload = oneDayVolume >= dailyVerificationRequiredLimit || (multiDayVolume !== null && multiDayVolume >= verificationRequiredLimit);
                if (needsUpload) await Users.updateOne({ _id: userId._id }, { $set: { isUserHaveToUploadBankStatement: true } });
            }
        } catch (err) {
            logger.error(`Error in volume check functionality: ${err.message}`);
        }
        done(null, { message: "Transaction completed successfully" });
    } catch (error) {
        if (process.env.NODE_ENV === "production" && error.description !== "Payment link not found") await sendEmailWithSES(ENV.DEVELOPER_EMAIL || "munsifalimisri69@gmail.com", "Cashin Error", error);
        await session.abortTransaction();
        session.endSession();
        done(error);
    }
    return false;
}
export default kushkiPaymentLinkWebHookHandler;
