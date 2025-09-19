/* eslint-disable camelcase */
import mongoose from "mongoose";
import moment from "moment";
import { EventTypes, Lenguages, NotificationTitles, NotificationPriority, NotificationTypes, Status, Applications, StableModelsNames, TransactionTypes, KushkiWebhookEvents, ScoreKeys } from "../../constants/index.js";
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
import ScoreHistory from "../../models/scoreHistory.js";

const eventCoverter = {
    approvedTransaction: "APPROVED",
    declinedTransaction: "DECLINED",
    expiredTransaction: "EXPIRED",
};
function getTimeAfterMinueHours(hours) {
    const now = new Date();
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

async function kushkiCashinWebHook(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, returnDocument: "after", new: true };
    const time = moment().utc();

    try {
        const { body: { status: event, transactionReference: depositId, processorState } } = req;

        const status = eventCoverter[event];
        if (!Object.values(KushkiWebhookEvents).includes(event) && event !== "expiredTransaction") return res.status(200).json({ message: "message recieved" });
        if (!Object.values(Status).includes(status?.toUpperCase())) throw new ApiError("Invalid Details", 400, "Status is not valid", true);
        const transaction = await CashinTransactionsV1.findOne({ depositId }, null, opts).populate({
            path: "userId",
            select: "balance language minimumBalance isBankStatementUploaded isUserHaveToUploadBankStatement bankStatementVerification devices notificationCount firstName lastName email",
            populate: { path: "userBalance", select: "userId balance" },
        });
        if (!transaction) throw new ApiError("Invalid Amount", 400, "Transaction not found", true);

        if (transaction.status !== Status.PENDING) return res.status(200).json({ message: `Transaction is not in pending state.` }).end();

        const { _id, userId, currentExchangeRate, amount, fee: { amount: feeAmount } } = transaction;
        const title = userId.language === "es" ? "Recarga " : "Money added ";
        if (event !== KushkiWebhookEvents.APPROVED) {
            const statusHistory = { status: status?.toUpperCase(), time };
            const updateQuery = {
                $set: { status: status?.toUpperCase() },
                $push: { statusHistory },
            };

            const updatedTransaction = await CashinTransactionsV1.findOneAndUpdate(
                { depositId },
                updateQuery,
                opts,
            );

            await Transactions.updateOne(
                { transactionRefrenceId: transaction._id },
                { $set: { status: status?.toUpperCase() } },
                opts,
            );

            // Fraud detection check
            try {
                const app = await getAppConfig();
                if (!app) throw new ApiError("App config not found", 400, "App config not found", true);
                const { cashin: { maxCashInTransactions = 4, durationInHoursToCheckTransactions = 4 } } = app;

                const timeToCheck = getTimeAfterMinueHours(durationInHoursToCheckTransactions);
                const checkIfAlreadyApplyFlag = await ScoreHistory.findOne({ userId: userId._id, code: ScoreKeys.FAILED_TXN, createdAt: { $gte: timeToCheck } });
                if (!checkIfAlreadyApplyFlag) {
                    const checkFailedTransactions = await checkCashinFailedTransactions(
                        userId._id,
                        durationInHoursToCheckTransactions,
                        transaction._id,
                    );

                    if ((checkFailedTransactions + 1) >= maxCashInTransactions) {
                        await fraudDetectionBlock(userId._id, "cashin failed transaction limit reach");
                        // update user score
                        const scoreData = {
                            userId: userId._id,
                            code: ScoreKeys.FAILED_TXN,
                        };
                        Event.emit(EventTypes.UpdateUserScore, scoreData);
                    }
                }
            } catch (err) {
                logger.error(`Error in fraud check functionality: ${err.message}`);
            }

            // Prepare and send notification
            const payloadForPushNotification = {
                notificationType: NotificationTypes.PaymentConfirmation,
                _id: updatedTransaction._id,
                userId: userId._id,
                depositId: updatedTransaction.depositId,
                amount: updatedTransaction.amount,
                cashinSuccess: true,
                localAmount: updatedTransaction.localAmount,
                currency: updatedTransaction.currency,
                status: status?.toUpperCase(),
                createdAt: updatedTransaction.createdAt,
                oneStableCoin: updatedTransaction.fee.oneStableCoin,
                currentExchangeRate,
                tType: "cashin",
                type: "cashin",
                paymentInfo: {
                    methodName: updatedTransaction.paymentInfo.methodName,
                },
            };

            const userActiveNotificationToken = activeNotificationTokenOfUser(userId.devices);
            await notificationsQueue.add("pushNotification", {
                title,
                message: await translateWithLenguageSpecifiedV1(userId.language)(
                    "payment_failed_response",
                    {
                        amount: convertToRequiredDecimalPlaces(transaction.amount, 2),
                        status: status?.toUpperCase(),
                    },
                ),
                tokens: userActiveNotificationToken,
                additionalDetails: payloadForPushNotification,
            }, { priority: NotificationPriority.TWO });

            // Log notification event
            const eventData = {
                userId: userId._id,
                message: await translateWithLenguageSpecifiedV1(Lenguages.English)(
                    "payment_failed_response",
                    {
                        amount: convertToRequiredDecimalPlaces(transaction.amount, 2),
                        status: status?.toUpperCase(),
                    },
                ),
                spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)(
                    "payment_failed_response",
                    {
                        amount: convertToRequiredDecimalPlaces(transaction.amount, 2),
                        status: status?.toUpperCase(),
                    },
                ),
                title: NotificationTitles.Payment_Confirmation,
                type: NotificationTypes.PaymentConfirmation,
            };
            Event.emit(EventTypes.Notification, eventData);

            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ message: `Transaction has been ${status?.toUpperCase()}` }).end();
        }

        const dbUser = await Users.findOne({ _id: userId }).populate({ path: "userBalance", select: "userId balance" });
        if (!dbUser) throw new ApiError("Invalid Details", 400, "user not found", true);
        if (!dbUser.userBalance) {
            throw new ApiError("Access denied", 401, "User balance not found", true);
        }

        // Update user balance
        const extraPayload = { opts };
        const balanceUpdateToUser = userId._id;
        const updateUserBalance = await updateBalance(balanceUpdateToUser, transaction.amount, extraPayload);

        // Update minimum balance if needed
        if (userId.minimumBalance < 50) {
            try {
                await Users.updateOne(
                    { _id: userId._id },
                    { $inc: { minimumBalance: Number(transaction.amount) } },
                    opts,
                );
            } catch (error) {
                logger.error(`Error updating minimumBalance: ${error.message}`);
            }
        }

        const userUpdatedBalance = updateUserBalance?.balance;
        const userLastBalance = userId.userBalance?.balance;

        // Calculate exchange profit
        const currencyId = currentExchangeRate._id;
        const exRate = currentExchangeRate.buying;
        const finalAmount = Number(feeAmount + amount) || 0;
        const calculateExRateProfit = await calculateExchangeProfit(currencyId, finalAmount, exRate, "amountIncToBuying", feeAmount || 0);

        const metaData = {
            exRateDifference: calculateExRateProfit.amountToDeduct,
            exRateProfit: calculateExRateProfit.exRateProfit,
            totalProfit: calculateExRateProfit.totalProfit,
        };

        // Update transaction
        const statusHistory = { status: Status.COMPLETED, time };
        const updateQuery = {
            $set: {
                status: Status.COMPLETED,
                userUpdatedBalance,
                userLastBalance,
                metaData,
            },
            $push: { statusHistory },
        };

        const updatedTransaction = await CashinTransactionsV1.findOneAndUpdate(
            { depositId },
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
            transactionModel: StableModelsNames.CASHIN_V1,
            amount: calculateExRateProfit.totalProfit,
            appType: Applications.STABLE_APP,
            transactionType: `${TransactionTypes.Kushki_CASHIN}`,
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
            depositId: updatedTransaction.depositId,
            amount: updatedTransaction.amount,
            cashinSuccess: true,
            localAmount: updatedTransaction.localAmount,
            currency: updatedTransaction.currency,
            status: Status.COMPLETED,
            createdAt: updatedTransaction.createdAt,
            oneStableCoin: updatedTransaction.fee.oneStableCoin,
            currentExchangeRate,
            tType: "cashin",
            type: "cashin",
            paymentInfo: {
                methodName: updatedTransaction.paymentInfo.methodName,
            },
        };

        await notificationsQueue.add("pushNotification", {
            title,
            message: await translateWithLenguageSpecifiedV1(userId.language)(
                "cashin_success_push_notification_message",
                { amountToUpdated: convertToRequiredDecimalPlaces(transaction.amount, 2) },
            ),
            tokens: userActiveNotificationToken,
            additionalDetails: payloadForPushNotification,
        }, { priority: NotificationPriority.TWO });

        // Log notification event
        const eventData = {
            userId: userId._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)(
                "cashin_success_push_notification_message",
                { amountToUpdated: convertToRequiredDecimalPlaces(transaction.amount, 2) },
            ),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)(
                "cashin_success_push_notification_message",
                { amountToUpdated: convertToRequiredDecimalPlaces(transaction.amount, 2) },
            ),
            title: NotificationTitles.Payment_Confirmation,
            type: NotificationTypes.PaymentConfirmation,
        };
        Event.emit(EventTypes.Notification, eventData);
        try {
            const checkIfFirstCashin = await ScoreHistory.findOne({ userId: userId._id, code: ScoreKeys.FIRST_CASHIN });
            if (!checkIfFirstCashin) {
                // update user score
                const scoreData = {
                    userId: userId._id,
                    code: ScoreKeys.FIRST_CASHIN,
                };
                Event.emit(EventTypes.UpdateUserScore, scoreData);
            }
        } catch (error) {
            logger.error(`error in update user score`);
        }
        // Send email notification
        const movementEmailTemplate = userId.language === Lenguages.Spanish
            ? "MovementTemplateSpanish"
            : "MovementTemplate";
        const fullName = `${capitalizeName(userId.firstName)} ${capitalizeName(userId.lastName)}`;
        const date = moment().tz("America/Bogota").format("YYYY-MM-DD");
        const emailTime = moment().tz("America/Bogota").format("HH:mm a");

        const emailPayload = {
            type: userId.language === Lenguages.Spanish ? "Recarga" : "Money added",
            tType: "cashin",
            amount: transaction.amount,
            localAmount: convertToRequiredDecimalPlaces(transaction.localAmount, 0),
            date,
            time: emailTime,
            exchageRate: convertToRequiredDecimalPlaces(transaction.fee.oneStableCoin, 0) || convertToRequiredDecimalPlaces(currentExchangeRate.buying, 0),
            fullName,
        };

        await sendEmailOrMessageV3({
            email: userId.email,
            onEmail: true,
            emailSubject: userId.language === Lenguages.Spanish ? "Recarga" : "Money added",
            templates: chooseEmailTemplateAndMessage(movementEmailTemplate, false, emailPayload),
        });

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
        logger.info(`Successfully processed OnePay cashin for deposit: ${depositId}`);
        return res.status(200).json({ message: "User balance has been updated" }).end();
    } catch (error) {
        if (process.env.NODE_ENV === "production") await sendEmailWithSES(ENV.DEVELOPER_EMAIL || "munsifalimisri69@gmail.com", "Cashin Error", `error :: ${error}  body :: ${JSON.stringify(req.body)}`);
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default kushkiCashinWebHook;
