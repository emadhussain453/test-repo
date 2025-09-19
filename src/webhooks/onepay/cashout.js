/* eslint-disable camelcase */
import mongoose from "mongoose";
import moment from "moment";
import { EventTypes, Lenguages, NotificationTitles, NotificationPriority, NotificationTypes, OnePayPaymentEvents, Status, Applications, StableModelsNames, TransactionTypes, OnePayCashoutPaymentEvents } from "../../constants/index.js";
import Users from "../../models/users.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import ENV from "../../config/keys.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import logger from "../../logger/index.js";
import { ApiError } from "../../utils/ApiError.js";
import Event from "../../Events/databaseLogs.js";
import Transactions from "../../models/transactions.js";
import updateBalance from "../../utils/balanceUpdate.js";
import calculateExchangeProfit from "../../utils/calculateExchangeProfit.js";
import FeeTransactions from "../../models/feeTransaction.js";
import Wallet from "../../models/feeWallet.js";
import capitalizeName from "../../utils/capitalizeName.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import TransactionsCashOut from "../../models/directaCashout.js";
import sendEmailWithSES from "../../config/sesEmail.js";

async function onePayCashoutWebHook(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, returnDocument: "after", new: true };
    const time = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");

    try {
        const { body: { event: { type }, cashout: { id, status } } } = req;
        const webToken = req.headers["x-webhook-token"];
        if (webToken !== ENV.ONEPAY.CASHOUT_WEB_TOKEN) console.log(`web token not match ::  ${webToken}`);
        if (process.env.NODE_ENV === "production" && webToken !== ENV.ONEPAY.CASHOUT_WEB_TOKEN) throw new ApiError("Access denied", 400, "Bad Auth", true);
        if (!Object.values(OnePayCashoutPaymentEvents).includes(type)) return res.status(200).json({ message: "message recieved" });
        if (!Object.values(Status).includes(status.toUpperCase())) throw new ApiError("Invalid Amount", 400, "Status is not valid", true);
        const transaction = await TransactionsCashOut.findOne({ cashoutId: id }, null, opts).populate({
            path: "userId",
            select: "language devices notificationCount",
        });
        if (!transaction) throw new ApiError("Invalid Amount", 400, "Transaction not found", true);

        // dont process expired/completed transactions, allow failed/rejected ones as they can be completed later
        if (transaction.status === Status.EXPIRED) return res.status(200).json({ message: `Transaction is already expired.` }).end();
        if (transaction.status === Status.COMPLETED) return res.status(200).json({ message: `Transaction is already completed.` }).end();
        if (transaction.status !== Status.PENDING) return res.status(200).json({ message: `Transaction is not in pending state.` }).end();

        const { _id, userId, currentExchageRate: currentExchangeRate, amount, fee: { amount: feeAmount } } = transaction;
        let title;
        title = userId.language === "es" ? "Retiro 🎉" : "Withdrawal 🎉";
        if (type !== OnePayCashoutPaymentEvents.COMPLETED) {
            if (status.toUpperCase() === Status.PROCESSED) return res.status(200).json({ message: `${type} event can not contain status: processed` }).end();
            const statusHistory = {
                status: status.toUpperCase(),
                time,
            };
            title = userId.language === "es" ? "Retiro 😢" : "Withdrawal 😢";
            const updateQuery = {
                $set: { status: status.toUpperCase() },
                $push: { statusHistory },
            };
            const newTransaction = await TransactionsCashOut.findOneAndUpdate({ cashoutId: id }, updateQuery, opts);
            await Transactions.updateOne({ transactionRefrenceId: transaction._id }, { $set: { status: status.toUpperCase() } }, opts);
            const extraPayload = {
                opts,
            };
            const balanceUpdateToUser = transaction.userId._id;
            await updateBalance(balanceUpdateToUser, transaction.amount, extraPayload);
            const payloadForPushNotification = {
                _id: newTransaction._id,
                cashoutId: newTransaction.cashoutId,
                amount: newTransaction.amount,
                cashoutSuccess: true,
                localAmount: newTransaction.localAmount,
                currency: newTransaction.currency,
                status: status.toUpperCase(),
                createdAt: newTransaction.createdAt,
                oneStableCoin: newTransaction.fee.oneStableCoin,
            };
            const userActiveNotificationToken = activeNotificationTokenOfUser(userId.devices);
            await notificationsQueue.add("pushNotification", {
                title,
                message: await translateWithLenguageSpecifiedV1(userId.language)("payment_failed_response", { amount: convertToRequiredDecimalPlaces(transaction.amount, 2), status: status.toUpperCase() }),
                tokens: userActiveNotificationToken,
                additionalDetails: payloadForPushNotification,
            }, { priority: NotificationPriority.TWO });
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ message: `Transaction has been ${status.toUpperCase()}` }).end();
        }
        if (status.toUpperCase() !== Status.PROCESSED) return res.status(200).json({ message: "cashout.completed event must contain status: processed" }).end();

        const dbUser = await Users.findOne({ _id: userId }).populate({ path: "userBalance", select: "userId balance" });
        if (!dbUser) throw new ApiError("Invalid Details", 400, "user not found", true);
        if (!dbUser.userBalance) {
            throw new ApiError("Access denied", 401, "User balance not found", true);
        }
        const statusHistory = {
            status: Status.COMPLETED,
            time,
        };
        // find difference of exRate for profit
        const currencyId = currentExchangeRate._id;
        const exRate = currentExchangeRate.selling;
        const finalAmount = Number(amount - feeAmount) || 0;
        const calculateExRateProfit = await calculateExchangeProfit(currencyId, finalAmount, exRate, "amountIncToSelling", feeAmount || 0);
        const metaData = {
            exRateDifference: calculateExRateProfit.amountToDeduct,
            exRateProfit: calculateExRateProfit.exRateProfit,
            totalProfit: calculateExRateProfit.totalProfit,
        };
        const updateQuery = {
            $set: { status: Status.COMPLETED, metaData },
            $push: { statusHistory },
        };
        const newTransaction = await TransactionsCashOut.findOneAndUpdate({ cashoutId: id }, updateQuery, opts);
        await Transactions.updateOne({ transactionRefrenceId: transaction._id }, { $set: { status: Status.COMPLETED } }, opts);

        // save fee profit amount in seperate transactions
        const feeTransTable = {
            transactionRefrenceId: _id,
            transactionModel: StableModelsNames.CASHOUT,
            amount: calculateExRateProfit.totalProfit,
            appType: Applications.STABLE_APP,
            transactionType: `${TransactionTypes.Onepay_CASHOUT}`,
            metaData: {
                exRateDifference: calculateExRateProfit.amountToDeduct,
                exRateProfit: calculateExRateProfit.exRateProfit,
                stableFeeDetuction: transaction.fee.stableFeeDetuction,
                serviceFeeDetuction: transaction.fee.serviceFeeDetuction,
            },
        };
        // before adding create a transaction in the database
        const feeTransTableData = new FeeTransactions(feeTransTable);
        await Wallet.updateOne(
            { $inc: { balance: calculateExRateProfit.totalProfit } },
        );
        await feeTransTableData.save(opts);
        await session.commitTransaction();
        session.endSession();

        // notification for user
        const userActiveNotificationToken = activeNotificationTokenOfUser(userId.devices);
        const payloadForPushNotification = {
            _id: newTransaction._id,
            depositId: newTransaction.depositId,
            amount: newTransaction.amount,
            cashinSuccess: true,
            localAmount: newTransaction.localAmount,
            currency: newTransaction.currency,
            status: Status.COMPLETED,
            createdAt: newTransaction.createdAt,
            oneStableCoin: newTransaction.fee.oneStableCoin,
        };
        await notificationsQueue.add("pushNotification", {
            title,
            message: await translateWithLenguageSpecifiedV1(userId.language)("payment_success_response", { amount: convertToRequiredDecimalPlaces(transaction.amount, 2) }),
            tokens: userActiveNotificationToken,
            additionalDetails: payloadForPushNotification,
        }, { priority: NotificationPriority.TWO });
        // log user notification
        const eventData = {
            userId: userId._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("payment_success_response", { amount: convertToRequiredDecimalPlaces(transaction.amount, 2) }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("payment_success_response", { amount: convertToRequiredDecimalPlaces(transaction.amount, 2) }),
            title: NotificationTitles.Payment_Confirmation,
            type: NotificationTypes.PaymentConfirmation,
        };
        Event.emit(EventTypes.Notification, eventData);

        logger.info(`User balance has been updated`);
        return res.status(200).json({ message: "User balance has been updated" }).end();
    } catch (error) {
        if (process.env.NODE_ENV === "production") await sendEmailWithSES(ENV.DEVELOPER_EMAIL || "munsifalimisri69@gmail.com", "Cashout Error", `error :: ${error}  body :: ${JSON.stringify(req.body)}`);
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default onePayCashoutWebHook;
