import mongoose from "mongoose";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Users from "../../models/users.js";
import BusinessTransaction from "../../models/businessTransactions.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import logger from "../../logger/index.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import { CountryCurrencies, EventTypes, Lenguages, NotificationPriority, NotificationTitles, NotificationTypes, ScoreKeys, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
import Event from "../../Events/databaseLogs.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import ExchangeRates from "../../models/exchangeRates.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import updateBalance from "../../utils/balanceUpdate.js";
import Transactions from "../../models/transactions.js";
import ScoreHistory from "../../models/scoreHistory.js";

const businessTransaction = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, returnDocument: "after", new: true };
    try {
        const { t: translate, body: { from, to, status, transactionId, senderBusinessId, senderName, transactionType, amount, description = "default Description" } } = req;
        const userIpAddress = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip;

        const dbUser = await Users.findOne({ _id: to, isVerified: true }).populate({ path: "userBalance", select: "userId balance" });
        if (!dbUser) throw new ApiError("Invalid Details", 400, translate("user_not_found"), true);
        if (dbUser?.isBlocked ?? false) {
            throw new ApiError(translate("Access denied"), 401, translate("account_blocked"), true);
        }
        if (!dbUser.userBalance) {
            throw new ApiError(translate("Access denied"), 401, translate("user_balance_not_found"), true);
        }
        if (dbUser?.isDeleted ?? false) {
            throw new ApiError(translate("Access denied"), 401, translate("account_deleted"), true);
        }
        if (typeof amount !== "number" || amount === null) throw new ApiError("Invalid Amount", 400, translate("amount_invalid_numeric"), true);
        if (!isValidMdbId(transactionId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "transactionId" }), true);
        if (!isValidMdbId(from)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "from" }), true);
        if (!isValidMdbId(to)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "to" }), true);

        const checkTransactionId = await BusinessTransaction.findOne({ transactionId });
        if (checkTransactionId) throw new ApiError("Access denied", 401, "TransactionId already exist.", true);
        const exchageRates = await ExchangeRates.findOne({ currency: CountryCurrencies[dbUser.country.countryCode] });
        if (!exchageRates) throw new ApiError("invalid request", 400, translate("exchange_rate_not_found", { currency: CountryCurrencies[dbUser.country.countryCode] }), true);
        const extraPayload = {
            opts,
            translate,
        };
        const balanceUpdateToUser = dbUser._id;
        const updateToUser = await updateBalance(balanceUpdateToUser, amount, extraPayload);
        const oneStableCoin = exchageRates.selling;
        const userLastBalance = dbUser.userBalance.balance;
        const userUpdatedBalance = updateToUser.balance;
        const transacciondata = new BusinessTransaction({
            userId: dbUser._id,
            from: {
                business: from,
                senderBusinessId,
                senderName,
            },
            status,
            amount,
            localAmount: amount * exchageRates.selling,
            description,
            currentExchageRate: exchageRates,
            transactionId,
            transactionType,
            userLastBalance,
            userUpdatedBalance,
            userIpAddress,
            fee: {
                oneStableCoin,
            },
        });
        if (!transacciondata) {
            throw new ApiError("Db Error", 500, translate("error_while_creating_transaction"), true);
        }
        const { _id: b2cId, localAmount } = transacciondata;

        // save the trantion in consolidatedTrasntions
        const globalTransTable = {
            transactionRefrenceId: b2cId,
            userId: dbUser._id,
            amount,
            sender: {
                businessId: senderBusinessId,
                name: senderName,
            },
            senderBusinessId,
            senderName,
            status: Status.COMPLETED,
            transactionModel: StableModelsNames.B2C,
            transactionType: TransactionTypes.B2C,
            localAmount,
            metaData: {
                fee: {
                    amount: 0,
                    localAmount: 0,
                    oneStableCoin,
                },
                currentExchageRate: exchageRates,
            },
        };

        // before adding create a transaction in the database
        const globalData = new Transactions(globalTransTable);
        await transacciondata.save(opts);
        await globalData.save(opts);
        await session.commitTransaction();
        session.endSession();
        if (dbUser.minimumBalance < 25) {
            try {
                await Users.updateOne({ _id: dbUser._id }, { $inc: { minimumBalance: amount } });
            } catch (error) {
                logger.error(`Error in updating minimumBalance value  error :: ${error}`);
            }
        }
        const payloadForPushNotification = {
            notificationType: NotificationTypes.PaymentConfirmation,
            _id: transacciondata._id,
            userId: dbUser._id,
            amount: transacciondata.amount,
            cashinSuccess: true,
            localAmount: transacciondata.localAmount,
            currency: transacciondata.currency,
            status: Status.COMPLETED,
            createdAt: transacciondata.createdAt,
            oneStableCoin,
            currentExchangeRate: exchageRates,
            tType: "cashin",
            type: "cashin",
            paymentInfo: {
                methodName: "B2C",
            },
        };
        const sendersActiveNotificationTokens = activeNotificationTokenOfUser(dbUser.devices);
        await notificationsQueue.add("pushNotification", {
            title: NotificationTypes.PaymentConfirmation,
            message: await translateWithLenguageSpecifiedV1(dbUser?.language)("receiver_message_push_notification_from_business", { fullName: senderName, businessId: senderBusinessId, amount: convertToRequiredDecimalPlaces(amount, 2) }),
            tokens: sendersActiveNotificationTokens,
            additionalDetails: payloadForPushNotification,
        }, { priority: NotificationPriority.ONE });

        try {
            const checkIfFirstCashin = await ScoreHistory.findOne({ userId: dbUser._id, code: ScoreKeys.FIRST_CASHIN });
            if (!checkIfFirstCashin) {
                // update user score
                const scoreData = {
                    userId: dbUser._id,
                    code: ScoreKeys.FIRST_CASHIN,
                };
                Event.emit(EventTypes.UpdateUserScore, scoreData);
            }
        } catch (error) {
            logger.error(`error in update user score`);
        }
        // log user notification
        const eventData = {
            userId: dbUser._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("receiver_message_push_notification_from_business", { fullName: senderName, businessId: senderBusinessId, amount: convertToRequiredDecimalPlaces(amount, 2) }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("receiver_message_push_notification_from_business", { fullName: senderName, businessId: senderBusinessId, amount: convertToRequiredDecimalPlaces(amount, 2) }),
            title: NotificationTitles.Payment_Confirmation,
            type: NotificationTypes.PaymentConfirmation,
        };
        Event.emit(EventTypes.Notification, eventData);
        return sendSuccessResponse(res, 200, true, translate("create_payment_success"), null);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return businessTransaction;
};

export default businessTransaction;
