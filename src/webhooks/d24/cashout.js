/* eslint-disable camelcase */
import CryptoJS from "crypto-js";
import moment from "moment";
import mongoose from "mongoose";
import DirectaCashout from "../../models/directaCashout.js";
import Users from "../../models/users.js";
import { Status, StableCurrencies, d24WebhookCashoutStatus, StableServicesFeatures, NotificationPriority, NotificationTitles, NotificationTypes, EventTypes, Lenguages, StableModelsNames, Applications, TransactionTypes } from "../../constants/index.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import logger from "../../logger/index.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import callApi from "../../utils/callApi.js";
import ENV from "../../config/keys.js";
import returnResponse from "../../utils/directa24/returnResponsed24Webhook.js";
import markCashoutDepositAsFailled from "../../utils/directa24/markCashoutDepositAsFailed.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import Event from "../../Events/databaseLogs.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import Transactions from "../../models/transactions.js";
import UserBalance from "../../models/userBalance.js";
import updateBalance from "../../utils/balanceUpdate.js";
import calculateExchangeProfit from "../../utils/calculateExchangeProfit.js";
import FeeTransactions from "../../models/feeTransaction.js";
import Wallet from "../../models/feeWallet.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import capitalizeName from "../../utils/capitalizeName.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";

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
const getTranslatedNotificationTitleAndMessage = (status = Status.COMPLETED, language = "en") => {
    const response = {};
    switch (status) {
        case "COMPLETED":
            response.message = "cashout_success_push_notification_message";
            response.title = language === "es" ? "Retiro 🎉" : "Withdrawal 🎉";
            break;
        case "CANCELLED":
            response.message = "cashout_cancelled_push_notification_message";
            response.title = language === "es" ? "Retiro cancelado" : "Cashout cancelled";
            break;
        case "DELIVERED":
            response.message = "cashout_delivered_push_notification_message";
            response.title = language === "es" ? "Retiro entregado" : "Cashout delivered";
            break;
        case "REJECTED":
            response.message = "cashout_rejected_push_notification_message";
            response.title = language === "es" ? "Retiro rechazado" : "Cashout rejected";
            break;
        default:
            break;
    }
    return response;
};

const headerForCashOut = (data) => {
    const body = JSON.stringify(data);
    const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, ENV.DIRECTA_24.API_SIGNATURE);
    hmac.update(body);
    const hash = hmac.finalize().toString(CryptoJS.enc.Hex);

    return {
        "Payload-Signature": hash,
    };
};

async function d24CashoutWebhookHandler(job, done) {
    const { invoiceId, cashoutId } = job.data;
    const time = moment().add(1, "day").utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session };
    try {
        logger.info("**** Executing Cashout Webhook ****");
        // find the dbCashout in the database
        const dbCashout = await DirectaCashout.findOne({ invoiceId, cashoutId });
        if (!dbCashout) {
            const message = "Deposit id not found in our database!";
            return done(null, returnResponse(400, message, StableServicesFeatures.DIRECTA24.CASHOUT));
        }

        const cashoutAmount = dbCashout.amount;
        const { currentExchageRate, amount, fee: { amount: feeAmount } } = dbCashout;

        // now find the user in the db with the detaiils givenby the directa24
        const user = await Users.findOne({ _id: dbCashout.userId }).populate({ path: "userBalance", select: "userId balance" });
        if (!user) {
            const message = "User not found against this depoit!";
            return done(null, returnResponse(400, message, StableServicesFeatures.DIRECTA24.CASHOUT));
        }
        if (!user.userBalance) {
            const message = "User balance not found";
            return done(null, returnResponse(400, message, StableServicesFeatures.DIRECTA24.CASHIN));
        }

        // check if invoice has already been rejected or cancelled in the db
        if (dbCashout.status === Status.REJECTED || dbCashout.status === Status.CANCELLED) {
            logger.info({
                user: user?.email,
                message: "hardcodedRejectedTransations",
                invoiceId,
                cashoutId,
            });
            const message = `This invoice has already been ${dbCashout.status} in the db!`;
            return done(null, returnResponse(200, message, StableServicesFeatures.DIRECTA24.CASHOUT));
        }
        // check if deposit is already completed in db
        if (dbCashout.status === Status.COMPLETED) {
            const message = "This invoice has alreasy been completed!";
            return done(null, returnResponse(400, message, StableServicesFeatures.DIRECTA24.CASHOUT));
        }

        // get the status of cashout out deposit fron direct24
        const apiBody = {
            login: ENV.DIRECTA_24.API_KEY,
            pass: ENV.DIRECTA_24.API_PASS,
            cashout_id: cashoutId,
        };
        const authHeaders = headerForCashOut(apiBody);
        const cashoutIdDetails = await callApi.callDirecta24Api("directa24BaseURL", "getCashoutDetails", "POST", apiBody, false, authHeaders);
        if (!cashoutIdDetails.success) {
            throw new Error(cashoutIdDetails.message);
        }

        const { cashout_status, cashout_status_description, bank_reference_id } = cashoutIdDetails.results;

        // now send push notification to user
        const payloadForPushNotification = {
            _id: dbCashout._id,
            cashoutId,
            amount: cashoutAmount,
            cashinSuccess: true,
            localAmount: dbCashout.localAmount,
            currency: StableCurrencies[dbCashout.currency],
            status: d24WebhookCashoutStatus[cashout_status] || Status.COMPLETED,
            createdAt: dbCashout.createdAt,
            oneStableCoin: dbCashout.fee.oneStableCoin,
        };
        const userData = {
            devices: user.devices,
            language: user.language,
        };

        // check if cashout is rejected or cancelled
        const cashoutRejectedStates = [2, 3];
        if (cashoutRejectedStates.includes(cashout_status)) {
            const statusCode = 200;
            const { status } = payloadForPushNotification;

            // first mark deposit as failed
            const message = `Deposit marked as ${status} and amount of ${cashoutAmount} SUSD  has been reembersed`;
            const response = await markCashoutDepositAsFailled({ cashoutId, message, depositStatus: status, statusCode, opts, reimbursed: true });

            // reemberse the user amount
            const extraPayload = {
                opts,
            };
            const balanceUpdateToUser = user._id;
            const balanceUpdated = await updateBalance(balanceUpdateToUser, cashoutAmount, extraPayload);

            logger.info(`Reemberesed user amount as his transaction is ${status}`);
            logger.info("amount to reemberse", cashoutAmount);
            logger.info(balanceUpdated);

            await session.commitTransaction();
            await session.endSession();

            const notificationData = getTranslatedNotificationTitleAndMessage(status, user.language);
            userData.title = notificationData.title;
            userData.message = notificationData.message;
            await sendNotificationHelper(userData, payloadForPushNotification);

            return done(null, response);
        }
        // check if cashout is delivered
        if (cashout_status === 4 && dbCashout.bankName === "EFECTY" && bank_reference_id) {
            const { status } = payloadForPushNotification;

            // first mark deposit as failed
            const message = `Deposit marked as ${status}.`;
            const response = await markCashoutDepositAsFailled({ cashoutId, message, depositStatus: status, opts });

            await session.commitTransaction();
            await session.endSession();

            const notificationData = getTranslatedNotificationTitleAndMessage(status, user.language);
            userData.title = notificationData.title;
            userData.message = notificationData.message;
            await sendNotificationHelper(userData, payloadForPushNotification);
            // send refernce to email & sms
            const { language, firstName, lastName, phoneNumber, email } = user;
            const effectyEmailTemplate = language === Lenguages.Spanish ? "EffectyEmailTemplateSpanish" : "EffectyEmailTemplate";
            const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
            const reference = bank_reference_id.split("#")[0];
            const emailPayload = { fullName, referenciaNumber: reference, email: user.email, phoneNumber };
            await sendEmailOrMessageV3({ email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Su transacción Efecty está lista para ser recogida" : "Your Efecty Transaction is Ready for Pickup", templates: chooseEmailTemplateAndMessage(effectyEmailTemplate, false, emailPayload) });
            return done(null, response);
        }
        if (cashout_status !== 1) {
            const { status } = payloadForPushNotification;
            const message = `Deposit marked as ${status}`;
            const response = await markCashoutDepositAsFailled({ cashoutId, message, depositStatus: status, opts });

            await session.commitTransaction();
            await session.endSession();
            return done(null, response);
        }
        const statusHistory = {
            status: Status.COMPLETED,
            time,
        };
        // find difference of exRate for profit
        const currencyId = currentExchageRate._id;
        const exRate = currentExchageRate.selling;
        const finalAmount = Number(amount - feeAmount) || 0;
        const calculateExRateProfit = await calculateExchangeProfit(currencyId, finalAmount, exRate, "amountDecToSelling", feeAmount || 0);
        const updateQuery = {
            $set: {
                status: Status.COMPLETED,
                metaData: {
                    exRateDifference: calculateExRateProfit.amountToDeduct,
                    exRateProfit: calculateExRateProfit.exRateProfit,
                    totalProfit: calculateExRateProfit.totalProfit,
                },
            },
            $push: { statusHistory },
        };

        // now change the status of invoice created in the db to completed
        const invoiceUpdated = await DirectaCashout.updateOne({ _id: dbCashout._id }, updateQuery, { returnDocument: "after", ...opts });
        await Transactions.updateOne({ transactionRefrenceId: dbCashout._id }, { $set: { status: Status.COMPLETED } }, opts);

        // save fee profit amount in seperate transactions
        const feeTransTable = {
            transactionRefrenceId: dbCashout._id,
            transactionModel: StableModelsNames.CASHOUT,
            amount: calculateExRateProfit.totalProfit,
            appType: Applications.STABLE_APP,
            transactionType: `${TransactionTypes.Cashout}`,
            metaData: {
                exRateDifference: calculateExRateProfit.amountToDeduct,
                exRateProfit: calculateExRateProfit.exRateProfit,
                stableFeeDetuction: dbCashout.fee.stableFeeDetuction,
                serviceFeeDetuction: dbCashout.fee.serviceFeeDetuction,
            },
        };
        // before adding create a transaction in the database
        const feeTransTableData = new FeeTransactions(feeTransTable);
        await Wallet.updateOne(
            { $inc: { balance: calculateExRateProfit.totalProfit } },
        );
        await feeTransTableData.save(opts);
        await session.commitTransaction();
        await session.endSession();
        const notificationData = getTranslatedNotificationTitleAndMessage(Status.COMPLETED, user.language);
        userData.title = notificationData.title;
        userData.message = notificationData.message;
        await sendNotificationHelper(userData, payloadForPushNotification);

        // log user notification
        const eventData = {
            userId: user._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)(notificationData.message, { amountToUpdated: convertToRequiredDecimalPlaces(cashoutAmount, 2) }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)(notificationData.message, { amountToUpdated: convertToRequiredDecimalPlaces(cashoutAmount, 2) }),
            title: NotificationTitles.Payment_Confirmation,
            type: NotificationTypes.PaymentConfirmation,
        };
        Event.emit(EventTypes.Notification, eventData);
        const res = {
            status: 200, /* Defaults to 200 */
            body: {
                success: true,
                message: "Cashout Webhook executed successfully.",
            },
        };
        return done(null, res);
    } catch (error) {
        const message = error?.response?.data || error?.message || error;
        const res = await markCashoutDepositAsFailled({ cashoutId, message, opts });

        await session.abortTransaction();
        await session.endSession();
        return done(error, res);
    }
}

export default d24CashoutWebhookHandler;
