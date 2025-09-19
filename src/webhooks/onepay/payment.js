/* eslint-disable camelcase */
import mongoose from "mongoose";
import crypto from "crypto-js";
import moment from "moment";
import { EventTypes, Lenguages, NotificationTitles, NotificationPriority, NotificationTypes, OnePayPaymentEvents, Status, Applications, StableModelsNames, TransactionTypes } from "../../constants/index.js";
import CashinTransactionsV1 from "../../models/transactionsCashinsV1.js";
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
import sendEmailWithSES from "../../config/sesEmail.js";
import checkCashinFailedTransactions from "../../utils/checkCashinFailedTransactions.js";
import getAppConfig from "../../utils/getAppConfig.js";
import fraudDetectionBlock from "../../utils/fraudDetection/fraudDetectionUserBlock.js";
import getUserCashinVolume from "../../utils/getUserCashinVolume.js";

async function onePayWebHook(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, returnDocument: "after", new: true };
    const time = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");

    try {
        const { body: { event: { type }, payment: { id, status } } } = req;
        const webToken = req.headers["x-webhook-token"];
        if (webToken !== ENV.ONEPAY.WEB_TOKEN) throw new ApiError("Access denied", 400, "Bad Auth", true);

        if (!Object.values(OnePayPaymentEvents).includes(type)) return res.status(200).json({ message: "message recieved" });
        if (!Object.values(Status).includes(status.toUpperCase())) throw new ApiError("Invalid Amount", 400, "Status is not valid", true);
        const transaction = await CashinTransactionsV1.findOne({ depositId: id }, null, opts).populate({
            path: "userId",
            select: " balance language minimumBalance devices notificationCount",
        });
        if (!transaction) throw new ApiError("Invalid Amount", 400, "Transaction not found", true);

        // dont process expired/completed transactions, allow failed/rejected ones as they can be completed later
        if (transaction.status === Status.EXPIRED) return res.status(200).json({ message: `Transaction is already expired.` }).end();
        if (transaction.status === Status.COMPLETED) return res.status(200).json({ message: `Transaction is already completed.` }).end();
        const { _id, userId, currentExchangeRate, amount, fee: { amount: feeAmount } } = transaction;
        const title = userId.language === "es" ? "Recarga " : "Money added ";
        const { bank_id, title: accountTitle, subtype, method_type } = req.body.payment.method || req.body.payment.payment_method || {};
        if (type !== OnePayPaymentEvents.APPROVED) {
            if (status.toUpperCase() === Status.APPROVED) return res.status(200).json({ message: `${type} event can not contain status: approved` }).end();
            const statusHistory = {
                status: status.toUpperCase(),
                time,
            };
            const updateQuery = {
                $set: { status: status.toUpperCase() },
                $push: { statusHistory },
            };
            const newTransaction = await CashinTransactionsV1.findOneAndUpdate({ depositId: id }, updateQuery, opts);
            await Transactions.updateOne({ transactionRefrenceId: transaction._id }, { $set: { status: status.toUpperCase() } }, opts);
            try {
                const app = await getAppConfig();
                if (!app) throw new ApiError("invalid details", 400, "app config not found", true);
                const { cashin: { maxCashInTransactions = 4, durationInHoursToCheckTransactions = 4 } } = app;
                const checkFailedTransactions = await checkCashinFailedTransactions(userId._id, durationInHoursToCheckTransactions, transaction._id);
                if ((checkFailedTransactions + 1) >= maxCashInTransactions) {
                    await fraudDetectionBlock(userId._id, "cashin failed transaction limit reach");
                }
            } catch (err) {
                logger.error(`error in fraud check functionality`);
            }
            const payloadForPushNotification = {
                _id: newTransaction._id,
                depositId: newTransaction.depositId,
                amount: newTransaction.amount,
                cashinSuccess: true,
                localAmount: newTransaction.localAmount,
                currency: newTransaction.currency,
                status: status.toUpperCase(),
                createdAt: newTransaction.createdAt,
                oneStableCoin: newTransaction.fee.oneStableCoin,
                paymentInfo: {
                    methodName: newTransaction.paymentInfo.methodName,
                },
            };
            const userActiveNotificationToken = activeNotificationTokenOfUser(userId.devices);
            await notificationsQueue.add("pushNotification", {
                title,
                message: await translateWithLenguageSpecifiedV1(userId.language)("payment_failed_response", { amount: convertToRequiredDecimalPlaces(transaction.amount, 2), status: status.toUpperCase() }),
                tokens: userActiveNotificationToken,
                additionalDetails: payloadForPushNotification,
            }, { priority: NotificationPriority.TWO });
            // log user notification
            const eventData = {
                userId: userId._id,
                message: await translateWithLenguageSpecifiedV1(Lenguages.English)("payment_failed_response", { amount: convertToRequiredDecimalPlaces(transaction.amount, 2), status: status.toUpperCase() }),
                spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("payment_failed_response", { amount: convertToRequiredDecimalPlaces(transaction.amount, 2), status: status.toUpperCase() }),
                title: NotificationTitles.Payment_Confirmation,
                type: NotificationTypes.PaymentConfirmation,
            };
            Event.emit(EventTypes.Notification, eventData);
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ message: `Transaction has been ${status.toUpperCase()}` }).end();
        }
        if (status.toUpperCase() !== Status.APPROVED) return res.status(200).json({ message: "Payment.approved event must contain status: approved" }).end();

        const dbUser = await Users.findOne({ _id: userId }).populate({ path: "userBalance", select: "userId balance" });
        if (!dbUser) throw new ApiError("Invalid Details", 400, "user not found", true);
        if (!dbUser.userBalance) {
            throw new ApiError("Access denied", 401, "User balance not found", true);
        }
        const extraPayload = {
            opts,
        };
        const balanceUpdateToUser = dbUser._id;
        const updateUserBalance = await updateBalance(balanceUpdateToUser, transaction.amount, extraPayload);
        if (userId.minimumBalance < 25) {
            try {
                await Users.updateOne({ _id: userId._id }, { $inc: { minimumBalance: Number(transaction.amount) } }, opts);
            } catch (error) {
                logger.error(`Error in updating minimumBalance value  error :: ${error}`);
            }
        }
        const userUpdatedBalance = updateUserBalance?.balance;
        const userLastBalance = dbUser.userBalance?.balance;
        const statusHistory = {
            status: Status.COMPLETED,
            time,
        };
        // find difference of exRate for profit
        const currencyId = currentExchangeRate._id;
        const exRate = currentExchangeRate.buying;
        const finalAmount = Number(feeAmount + amount) || 0;
        const calculateExRateProfit = await calculateExchangeProfit(currencyId, finalAmount, exRate, "amountIncToBuying", feeAmount || 0);
        const metaData = {
            exRateDifference: calculateExRateProfit.amountToDeduct,
            exRateProfit: calculateExRateProfit.exRateProfit,
            totalProfit: calculateExRateProfit.totalProfit,
        };
        const updateQuery = {
            $set: { status: Status.COMPLETED, userUpdatedBalance, userLastBalance, metaData },
            $push: { statusHistory },
        };
        const newTransaction = await CashinTransactionsV1.findOneAndUpdate({ depositId: id }, updateQuery, opts);
        await Transactions.updateOne({ transactionRefrenceId: transaction._id }, { $set: { status: Status.COMPLETED } }, opts);

        // save fee profit amount in seperate transactions
        const feeTransTable = {
            transactionRefrenceId: _id,
            transactionModel: StableModelsNames.CASHIN_V1,
            amount: calculateExRateProfit.totalProfit,
            appType: Applications.STABLE_APP,
            transactionType: `${TransactionTypes.Onepay_CASHIN}`,
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
            paymentInfo: {
                methodName: newTransaction.paymentInfo.methodName,
            },
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

        const { language, firstName, lastName, email } = dbUser;
        const movementEmailTemplate = language === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;

        const date = moment().tz("America/Bogota").format("YYYY-MM-DD");
        const emailTime = moment().tz("America/Bogota").format("HH:mm a");
        const emailPayload = { type: language === Lenguages.Spanish ? "Recarga" : "Money added", tType: "cashin", amount: transaction.amount, localAmount: transaction.localAmount, date, time: emailTime, exchageRate: transaction.fee.oneStableCoin || currentExchangeRate.buying, fullName };
        await sendEmailOrMessageV3({ email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Recarga" : "Money added", templates: chooseEmailTemplateAndMessage(movementEmailTemplate, false, emailPayload) });

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
        logger.info(`User balance has been updated`);
        return res.status(200).json({ message: "User balance has been updated" }).end();
    } catch (error) {
        if (process.env.NODE_ENV === "production") await sendEmailWithSES(ENV.DEVELOPER_EMAIL || "munsifalimisri69@gmail.com", "Cashin Error", `error :: ${error}  body :: ${JSON.stringify(req.body)}`);
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default onePayWebHook;
