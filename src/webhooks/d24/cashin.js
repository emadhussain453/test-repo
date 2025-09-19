/* eslint-disable camelcase */
import moment from "moment";
import logger from "../../logger/index.js";
import createAuthHash from "../../utils/directa24/createAuthHash.js";
import Users from "../../models/users.js";
import { Status, StableCurrencies, NotificationPriority, StableServicesFeatures, EventTypes, NotificationTitles, NotificationTypes, Lenguages, StableModelsNames, Applications, TransactionTypes } from "../../constants/index.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import callApi from "../../utils/callApi.js";
import returnResponse from "../../utils/directa24/returnResponsed24Webhook.js";
import CashinTransactionsV1 from "../../models/transactionsCashinsV1.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import Event from "../../Events/databaseLogs.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import Transactions from "../../models/transactions.js";
import PaymentLinksSchema from "../../models/paymentLinks.js";
import getStatusHistoryObject from "../../utils/getStatusHistoryObject.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import States from "../../models/states.js";
import capitalizeName from "../../utils/capitalizeName.js";
import UserBalance from "../../models/userBalance.js";
import updateBalance from "../../utils/balanceUpdate.js";
import calculateExchangeProfit from "../../utils/calculateExchangeProfit.js";
import FeeTransactions from "../../models/feeTransaction.js";
import Wallet from "../../models/feeWallet.js";

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
const markDepositAsFailled = async (depositId, message, depositStatus = Status.FAILED) => {
    try {
        if (depositId) {
            const status = depositStatus;
            const time = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
            const statusHistory = {
                status,
                time,
            };
            const updateQuery = {
                $set: { status },
                $push: { statusHistory },
            };

            if (depositStatus === Status.FAILED) {
                updateQuery.failedMessage = message;
            }
            const updatedCashin = await CashinTransactionsV1.findOneAndUpdate({ depositId }, updateQuery);
            await Transactions.updateOne({ transactionRefrenceId: updatedCashin._id }, { $set: { status } });
        }
        return returnResponse(400, message, StableServicesFeatures.DIRECTA24.CASHIN);
    } catch (error) {
        throw new Error(error.message);
    }
};

const updatePaymentLinkStatus = async (plid, updateQuery = {}) => {
    await PaymentLinksSchema.updateOne({ _id: plid }, updateQuery);
};

const getDepositStatus = async (depositId) => {
    try {
        const params = `/${depositId}`;
        const headers = createAuthHash();
        const depoitDetails = await callApi.callDirecta24Api("directa24BaseURL", "getCashinDepositIdDetails", "GET", false, params, headers);
        return depoitDetails.results;
    } catch (error) {
        throw new Error(error.message);
    }
};

async function d24CashinWebhookHandler(job, done) {
    const { depositId } = job.data;
    const time = moment().utc();
    try {
        logger.info("**** Executing Cashin Webhook ****");

        // find the deposit in the database
        const deposit = await CashinTransactionsV1.findOne({ depositId });
        if (!deposit) {
            const message = "Deposit id not found in our database!";
            return done(null, returnResponse(400, message, StableServicesFeatures.DIRECTA24.CASHIN));
        }
        const payerAmount = deposit.amount;
        const payerLocalAmount = deposit.localAmount;
        // now find the user in the db with the detaiils givenby the directa24

        const { paymentLinkRefranceId, currentExchangeRate } = deposit;
        const user = await Users.findOne({ _id: deposit.userId }).populate({ path: "userBalance", select: "userId balance" }); // email, phoneNumber: phone
        if (!user) {
            const message = "User not found against this depoit!";
            return done(null, returnResponse(400, message, StableServicesFeatures.DIRECTA24.CASHIN));
        }
        if (!user.userBalance) {
            const message = "User balance not found";
            return done(null, returnResponse(400, message, StableServicesFeatures.DIRECTA24.CASHIN));
        }
        // check if invoice has already been rejected or cancelled in the db
        if (deposit.status === Status.REJECTED || deposit.status === Status.CANCELLED || deposit.status === Status.FAILED) {
            logger.info({
                user: user?.email,
                message: "hardcodedRejectedTransations",
                invoiceId: deposit.invoiceId,
                depositId,
            });
            const message = `This invoice has already been ${deposit.status} in the db!`;
            return done(null, returnResponse(200, message, StableServicesFeatures.DIRECTA24.CASHIN));
        }
        let PayerUser;
        if (paymentLinkRefranceId) {
            PayerUser = await PaymentLinksSchema.findOne({ _id: paymentLinkRefranceId }); // email, phoneNumber: phone
            if (!PayerUser) {
                const message = "User not found against this depoit!";
                return done(null, returnResponse(400, message, StableServicesFeatures.DIRECTA24.CASHIN));
            }
        }
        // check if invoice has already been paid
        if (deposit.status === Status.COMPLETED) {
            const message = "This invoice has alreasy been paid!";
            return done(null, returnResponse(400, message, StableServicesFeatures.DIRECTA24.CASHIN));
        }

        // now get details of deposit from directa24
        const depositIdDetails = await getDepositStatus(depositId);
        const { user_id, status, usd_amount, local_amount, payment_method, payer: { phone, email }, fee_amount, fee_currency } = depositIdDetails;
        logger.info({ user_id, status, usd_amount, local_amount, payment_method, phone, email });

        const amountToUpdated = deposit.amount;
        // now send push notification to user
        const payloadForPushNotification = {
            _id: deposit._id,
            depositId,
            cashinSuccess: true,
            paymentInfo: deposit.paymentInfo,
            amount: amountToUpdated,
            localAmount: local_amount,
            currency: StableCurrencies[deposit.currency],
            createdAt: deposit.createdAt,
            oneStableCoin: deposit.fee.oneStableCoin,
        };
        const userData = {
            devices: user.devices,
            language: user.language,
        };

        if (status === Status.EXPIRED) {
            const response = markDepositAsFailled(depositId, `Returning as invoice has been ${status}`, status);

            if (paymentLinkRefranceId) {
                const updateQuery = {
                    $set: { status },
                    $push: { statusHistory: getStatusHistoryObject(status, false) },
                };
                await updatePaymentLinkStatus(paymentLinkRefranceId, updateQuery);
            }

            payloadForPushNotification.status = status;
            const title = user?.language === "es" ? "Expirar " : "Expire ";
            userData.title = title;
            userData.message = "cashin_expired_push_notification_message";
            await sendNotificationHelper(userData, payloadForPushNotification);
            return done(null, response);
        }

        if (status !== Status.COMPLETED) {
            const response = markDepositAsFailled(depositId, `Returning as invoice is not ${status}`, status);
            if (paymentLinkRefranceId) {
                const updateQuery = {
                    $set: { status },
                    $push: { statusHistory: getStatusHistoryObject(status, false) },
                };
                await updatePaymentLinkStatus(paymentLinkRefranceId, updateQuery);
            }
            payloadForPushNotification.status = status;
            const title = user?.language === "es" ? "Fallida " : "Failed ";
            userData.title = title;
            userData.message = "cashin_failed_push_notification_message";
            await sendNotificationHelper(userData, payloadForPushNotification);
            return done(null, response);
        }
        const extraPayload = {};
        const balanceUpdateToUser = user._id;
        await updateBalance(balanceUpdateToUser, amountToUpdated, extraPayload);
        // const balanceUpdated = await UserBalance.findOneAndUpdate({ userId: user.userBalance.userId }, { $inc: { balance: amountToUpdated } }, { upsert: true });
        logger.info("**** Balance Updated with exchange rates ****");

        // now change the status of invoice created in the db to completed
        const userUpdatedBalance = user.userBalance.balance + amountToUpdated;
        // find difference of exRate for profit
        const currencyId = currentExchangeRate._id;
        const exRate = currentExchangeRate.buying;
        const feeAmount = deposit.fee.amount;
        const finalAmount = Number(feeAmount + deposit.amount) || 0;
        const calculateExRateProfit = await calculateExchangeProfit(currencyId, finalAmount, exRate, "amountIncToBuying", feeAmount || 0);
        const updateQuery = {
            status: Status.COMPLETED,
            "fee.serviceFeeAfter": fee_amount,
            userLastBalance: user.userBalance.balance,
            userUpdatedBalance,
            metaData: {
                exRateDifference: calculateExRateProfit.amountToDeduct,
                exRateProfit: calculateExRateProfit.exRateProfit,
                totalProfit: calculateExRateProfit.totalProfit,
            },
        };
        updateQuery.$push = {
            statusHistory: getStatusHistoryObject(Status.COMPLETED, false),
        };
        const invoiceUpdated = await CashinTransactionsV1.updateOne({ depositId }, updateQuery, { upsert: true });
        await Transactions.updateOne({ transactionRefrenceId: deposit._id }, { $set: { status: Status.COMPLETED } });

        // save fee profit amount in seperate transactions
        const feeTransTable = {
            transactionRefrenceId: deposit._id,
            transactionModel: StableModelsNames.CASHIN_V1,
            amount: calculateExRateProfit.totalProfit,
            appType: Applications.STABLE_APP,
            transactionType: `${TransactionTypes.Cashin}`,
            metaData: {
                exRateDifference: calculateExRateProfit.amountToDeduct,
                exRateProfit: calculateExRateProfit.exRateProfit,
                stableFeeDetuction: deposit.fee.stableFeeDetuction,
                serviceFeeDetuction: deposit.fee.serviceFeeDetuction,
            },
        };
        // before adding create a transaction in the database
        const feeTransTableData = new FeeTransactions(feeTransTable);
        await Wallet.updateOne(
            { $inc: { balance: calculateExRateProfit.totalProfit } },
        );
        await feeTransTableData.save();

        // check if the trasntion was made using payment_links
        if (paymentLinkRefranceId) {
            const updatePlQuery = {
                $set: { status: Status.COMPLETED },
                $push: { statusHistory: getStatusHistoryObject(Status.COMPLETED, false) },
            };
            await updatePaymentLinkStatus(paymentLinkRefranceId, updatePlQuery);
        }

        if (user.minimumBalance < 25) {
            try {
                await Users.updateOne({ _id: user._id }, { $inc: { minimumBalance: amountToUpdated } });
            } catch (error) {
                logger.error(`Error in updating minimumBalance value  error :: ${error}`);
            }
        }

        if (paymentLinkRefranceId && status === Status.COMPLETED) {
            const date = moment().tz("America/Bogota").format("YYYY-MM-DD");
            const emailtime = moment().tz("America/Bogota").format("HH:mm a");
            const senderFullName = `${capitalizeName(user.firstName)} ${capitalizeName(user.lastName)}`;
            const receiverFullName = `${capitalizeName(PayerUser.payerPersonalDetails.firstName)} ${capitalizeName(PayerUser.payerPersonalDetails.lastName)}`;
            const senderEmailTemplate = user.language === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
            const { language } = user;
            const emailSubject = "Deposit Status Update";

            const PayerEmail = PayerUser.payerPersonalDetails.email;
            const emailPayloadForSender = {
                type: language === Lenguages.Spanish ? "Transferir dinero" : "Transfer Money",
                transactionName: "P2P",
                tType: "Cashout",
                amount: convertToRequiredDecimalPlaces(payerAmount, 2),
                localAmount: convertToRequiredDecimalPlaces(payerLocalAmount, 2),
                date,
                time: emailtime,
                exchageRate: currentExchangeRate.buying,
                receiverUserName: capitalizeName(senderFullName),
                fullName: receiverFullName,
            };
            await sendEmailOrMessageV3({ email: PayerEmail, onEmail: true, emailSubject, templates: chooseEmailTemplateAndMessage(senderEmailTemplate, false, emailPayloadForSender) });
        }

        // now send push notification to user
        const title = user?.language === "es" ? "Recarga " : "Money added ";
        userData.title = title;
        userData.message = "cashin_success_push_notification_message";
        payloadForPushNotification.status = Status.COMPLETED;
        await sendNotificationHelper(userData, payloadForPushNotification);

        // log user notification
        const eventData = {
            userId: user._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("cashin_success_push_notification_message", { amountToUpdated: convertToRequiredDecimalPlaces(amountToUpdated, 2) }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("cashin_success_push_notification_message", { amountToUpdated: convertToRequiredDecimalPlaces(amountToUpdated, 2) }),
            title: NotificationTitles.Payment_Confirmation,
            type: NotificationTypes.PaymentConfirmation,
        };
        Event.emit(EventTypes.Notification, eventData);
        const { language, firstName, lastName } = user;
        const movementEmailTemplate = language === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;

        const date = moment().tz("America/Bogota").format("YYYY-MM-DD");
        const emailTime = moment().tz("America/Bogota").format("HH:mm a");
        const emailPayload = { type: language === Lenguages.Spanish ? "Recarga" : "Money added", tType: "cashin", amount: amountToUpdated, localAmount: local_amount, date, time: emailTime, exchageRate: currentExchangeRate.buying, fullName };
        await sendEmailOrMessageV3({ email: user.email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Recarga" : "Money added", templates: chooseEmailTemplateAndMessage(movementEmailTemplate, false, emailPayload) });
        const res = {
            status: 200, /* Defaults to 200 */
            body: {
                success: true,
                message: "Webhook executed successfully.",
            },
        };
        return done(null, res);
    } catch (error) {
        const res = markDepositAsFailled(depositId, error?.response?.data || error?.message || error);
        return done(error, res);
    }
}

export default d24CashinWebhookHandler;
