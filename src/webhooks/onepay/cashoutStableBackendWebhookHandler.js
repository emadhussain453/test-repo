import mongoose from "mongoose";
import moment from "moment";
import {
    EventTypes,
    Lenguages,
    NotificationTitles,
    NotificationPriority,
    NotificationTypes,
    Status,
    Applications,
    StableModelsNames,
    TransactionTypes,
    OnePayCashoutPaymentEvents,
} from "../../constants/index.js";
import Users from "../../models/users.js";
import ENV from "../../config/keys.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import logger from "../../logger/index.js";
import { ApiError } from "../../utils/ApiError.js";
import Event from "../../Events/databaseLogs.js";
import Transactions from "../../models/transactions.js";
import updateBalance from "../../utils/balanceUpdate.js";
import calculateExchangeProfit from "../../utils/calculateExchangeProfit.js";
import FeeTransactions from "../../models/feeTransaction.js";
import Wallet from "../../models/feeWallet.js";
import TransactionsCashOut from "../../models/directaCashout.js";
import sendEmailWithSES from "../../config/sesEmail.js";

async function onepayCashoutStableBackendWebhookHandler(job, done) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, returnDocument: "after", new: true };
    const time = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");

    try {
        const { cashoutId, status, type } = job.data;

        logger.info(`Processing OnePay cashout webhook for cashoutId: ${cashoutId}`);

        const transaction = await TransactionsCashOut.findOne({ cashoutId }, null, opts).populate({
            path: "userId",
            select: "language devices notificationCount firstName lastName email",
            populate: { path: "userBalance", select: "userId balance" },
        });

        if (!transaction) {
            throw new ApiError("Transaction not found", 404, "Transaction not found in user", true);
        }

        // Skip if already processed
        if (transaction.status === Status.EXPIRED) {
            logger.info(`Transaction ${cashoutId} is already expired`);
            return done(null, { message: "Transaction already expired" });
        }

        if (transaction.status === Status.COMPLETED) {
            logger.info(`Transaction ${cashoutId} is already completed`);
            return done(null, { message: "Transaction already completed" });
        }

        if (transaction.status !== Status.PENDING) {
            logger.info(`Transaction ${cashoutId} is not in pending state`);
            return done(null, { message: "Transaction not in pending state" });
        }

        const { _id, userId, bankName, currentExchageRate: currentExchangeRate, userLastBalance, amount, fee: { amount: feeAmount } } = transaction;
        let title;
        title = userId.language === "es" ? "Retiro 🎉" : "Withdrawal 🎉";

        if (type !== OnePayCashoutPaymentEvents.COMPLETED) {
            if (status.toUpperCase() === Status.PROCESSED) {
                throw new ApiError("Invalid status", 400, "Processed status not allowed for this event type", true);
            }
            title = userId.language === "es" ? "Retiro 😢" : "Withdrawal 😢";

            // Update transaction status
            const statusHistory = { status: status.toUpperCase(), time };
            const updateQuery = {
                $set: { status: status.toUpperCase(), userUpdatedBalance: userLastBalance },
                $push: { statusHistory },
            };

            const updatedTransaction = await TransactionsCashOut.findOneAndUpdate(
                { cashoutId },
                updateQuery,
                opts,
            );

            await Transactions.updateOne(
                { transactionRefrenceId: transaction._id },
                { $set: { status: status.toUpperCase() } },
                opts,
            );

            // Refund user balance if transaction failed
            const extraPayload = { opts };
            const balanceUpdateToUser = transaction.userId._id;
            await updateBalance(balanceUpdateToUser, transaction.amount, extraPayload);

            // Prepare and send notification
            const payloadForPushNotification = {
                notificationType: NotificationTypes.PaymentConfirmation,
                _id: updatedTransaction._id,
                userId: userId._id,
                cashoutId: updatedTransaction.cashoutId,
                amount: updatedTransaction.amount,
                cashoutSuccess: true,
                localAmount: updatedTransaction.localAmount,
                currency: updatedTransaction.currency,
                status: status.toUpperCase(),
                createdAt: updatedTransaction.createdAt,
                oneStableCoin: updatedTransaction.fee.oneStableCoin,
                bankName,
                currentExchangeRate,
                tType: "cashout",
                type: "cashout",
            };

            const userActiveNotificationToken = activeNotificationTokenOfUser(userId.devices);
            await notificationsQueue.add("pushNotification", {
                title,
                message: await translateWithLenguageSpecifiedV1(userId.language)(
                    "payment_failed_response",
                    {
                        amount: convertToRequiredDecimalPlaces(transaction.amount, 2),
                        status,
                    },
                ),
                tokens: userActiveNotificationToken,
                additionalDetails: payloadForPushNotification,
            }, { priority: NotificationPriority.TWO });
            // log user notification
            const eventData = {
                userId: userId._id,
                message: await translateWithLenguageSpecifiedV1(Lenguages.English)("payment_failed_response", { amount: convertToRequiredDecimalPlaces(transaction.amount, 2) }),
                spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("payment_failed_response", { amount: convertToRequiredDecimalPlaces(transaction.amount, 2) }),
                title: NotificationTitles.Payment_Confirmation,
                type: NotificationTypes.PaymentConfirmation,
            };
            Event.emit(EventTypes.Notification, eventData);
            await session.commitTransaction();
            session.endSession();
            return done(null, { message: `Transaction marked as ${status}` });
        }

        // Handle completed cashouts
        if (status.toUpperCase() !== Status.PROCESSED) {
            throw new ApiError("Invalid status", 400, "Completed event must have processed status", true);
        }

        const dbUser = await Users.findOne({ _id: userId }).populate("userBalance").session(session);
        if (!dbUser) throw new ApiError("User not found", 404, "User not found", true);
        if (!dbUser.userBalance) {
            throw new ApiError("User balance not found", 404, "User balance not found", true);
        }

        // Update transaction status
        const statusHistory = {
            status: Status.COMPLETED,
            time,
        };

        // Calculate exchange profit
        const currencyId = currentExchangeRate._id;
        const exRate = currentExchangeRate.selling;
        const finalAmount = Number(amount - feeAmount) || 0;
        const calculateExRateProfit = await calculateExchangeProfit(
            currencyId,
            finalAmount,
            exRate,
            "amountIncToSelling",
            feeAmount || 0,
        );

        const metaData = {
            exRateDifference: calculateExRateProfit.amountToDeduct,
            exRateProfit: calculateExRateProfit.exRateProfit,
            totalProfit: calculateExRateProfit.totalProfit,
        };

        const updateQuery = {
            $set: { status: Status.COMPLETED, metaData },
            $push: { statusHistory },
        };

        const updatedTransaction = await TransactionsCashOut.findOneAndUpdate(
            { cashoutId },
            updateQuery,
            opts,
        );

        await Transactions.updateOne(
            { transactionRefrenceId: transaction._id },
            { $set: { status: Status.COMPLETED } },
            opts,
        );

        // Save fee profit
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

        const feeTransTableData = new FeeTransactions(feeTransTable);
        await Wallet.updateOne(
            {},
            { $inc: { balance: calculateExRateProfit.totalProfit } },
            opts,
        );
        await feeTransTableData.save(opts);

        await session.commitTransaction();
        session.endSession();

        // Send success notification
        const userActiveNotificationToken = activeNotificationTokenOfUser(userId.devices);
        const payloadForPushNotification = {
            notificationType: NotificationTypes.PaymentConfirmation,
            _id: updatedTransaction._id,
            userId: userId._id,
            cashoutId: updatedTransaction.cashoutId,
            amount: updatedTransaction.amount,
            cashoutSuccess: true,
            localAmount: updatedTransaction.localAmount,
            currency: updatedTransaction.currency,
            status: Status.COMPLETED,
            createdAt: updatedTransaction.createdAt,
            oneStableCoin: updatedTransaction.fee.oneStableCoin,
            bankName,
            currentExchangeRate,
            tType: "cashout",
            type: "cashout",
        };

        await notificationsQueue.add("pushNotification", {
            title,
            message: await translateWithLenguageSpecifiedV1(userId.language)(
                "payment_success_response",
                { amount: convertToRequiredDecimalPlaces(transaction.amount, 2), status: status.toUpperCase() },
            ),
            tokens: userActiveNotificationToken,
            additionalDetails: payloadForPushNotification,
        }, { priority: NotificationPriority.TWO });

        // Log notification event
        const eventData = {
            userId: userId._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)(
                "payment_success_response",
                { amount: convertToRequiredDecimalPlaces(transaction.amount, 2) },
            ),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)(
                "payment_success_response",
                { amount: convertToRequiredDecimalPlaces(transaction.amount, 2) },
            ),
            title: NotificationTitles.Payment_Confirmation,
            type: NotificationTypes.PaymentConfirmation,
        };
        Event.emit(EventTypes.Notification, eventData);

        logger.info(`Successfully processed OnePay cashout: ${cashoutId}`);
        done(null, {
            message: "Cashout completed successfully",
            transactionId: _id,
            amount,
            userId: userId._id,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(`Error processing OnePay cashout webhook: ${error.message}`);

        if (process.env.NODE_ENV === "production" && error.description !== "Transaction not found in user") {
            await sendEmailWithSES(
                ENV.DEVELOPER_EMAIL || "munsifalimisri69@gmail.com",
                "Cashout Webhook Error",
                `Cashout ID: ${job?.data?.cashoutId || "unknown"}\nError: ${error.message}\nStack: ${error.stack}`,
            ).catch((emailError) => {
                logger.error(`Failed to send error email: ${emailError}`);
            });
        }

        done(error);
    }
    return onepayCashoutStableBackendWebhookHandler;
}

export default onepayCashoutStableBackendWebhookHandler;
