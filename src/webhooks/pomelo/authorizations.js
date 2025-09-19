import moment from "moment";
import mongoose from "mongoose";
import { ExTypes, POMELO_IP_ADDRESSES, PomeloCardBLockStatus, PomeloTransactionOrigin, PomeloWebhookMethods, PomeloWebhookStatus, PomeloWebhookStatusDetails, Status, TrnasactionsTypes, feeTypes, EventTypes, Lenguages, NotificationTitles, NotificationTypes, StableModelsNames, TransactionTypes, CountryCurrencies, Applications } from "../../constants/index.js";
import PomeloUsers from "../../models/pomeloUser.js";
import TransactionsCards from "../../models/transactionsCards.js";
import Users from "../../models/users.js";
import applyCurrencyExchangeRateOnAmount from "../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import sendErrorResponse from "../../utils/pomelo/sendErrorResponse.js";
import sendPomeloSuccessReponse from "../../utils/pomelo/sendPomeloSuccessReponse.js";
import ExchangeRates from "../../models/exchangeRates.js";
import logger from "../../logger/index.js";
import calculateFee from "../../utils/calculateFee.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import sendNotification from "./notificationSendHelper.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import Event from "../../Events/databaseLogs.js";
import Transactions from "../../models/transactions.js";
import UserBalance from "../../models/userBalance.js";
import updateBalance from "../../utils/balanceUpdate.js";
import AutoExchanges from "../../models/autoExchange.js";
import FeeTransactions from "../../models/feeTransaction.js";
import Wallet from "../../models/feeWallet.js";
import calculateExchangeProfit from "../../utils/calculateExchangeProfit.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";

const authorizations = async (req, res, next) => {
    const timeToRespond = 4; // secondds
    const executeApiWithtinTimeframe = moment();
    let session = null;
    try {
        const { body: { transaction, merchant, card, user, amount, extra_data: extraData }, userIpAddress } = req;

        if (process.env.NODE_ENV === "production") {
            if (!POMELO_IP_ADDRESSES.includes(req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "Invalid Ip address");
        }
        // find pomelo user
        const isPomeloUser = await PomeloUsers.findOne({ pomeloUserId: user.id }).populate({
            path: "userId",
            select: "isBlocked email balance isVerified language firstName lastName devices country",
        });
        if (!isPomeloUser) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "User not found.", true);
        }
        if (isPomeloUser.userId.isBlocked) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "User is blocked in stable", true);
        }
        if (!isPomeloUser.userId.isVerified) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "User is not verified.", true);
        }
        const userBalance = await UserBalance.findOne({ userId: isPomeloUser.userId._id });

        if (!userBalance) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "User balance not found");
        }
        const exchageRates = await ExchangeRates.findOne({ currency: amount.local.currency });
        if (!exchageRates) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "Exchange rate not available", true);
        }
        const amountConvertedFromLocalCurrToSusd = await applyCurrencyExchangeRateOnAmount(amount.local.total, amount.local.currency, ExTypes.Selling, true, 4);

        // amount to deduct
        let transactionType = feeTypes.CARD_TRANSACTION_DOMESTIC;
        let amountToDeduct = amountConvertedFromLocalCurrToSusd;

        if (transaction.origin === PomeloTransactionOrigin.INTERNATIONAL) {
            amountToDeduct = amount.settlement.total;
            transactionType = feeTypes.CARD_TRANSACTION_INTERNATIONAL;
        } else if (transaction.origin === PomeloTransactionOrigin.DOMESTIC) {
            amountToDeduct = amountConvertedFromLocalCurrToSusd;
            transactionType = feeTypes.CARD_TRANSACTION_DOMESTIC;
        } else {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "Invalid transaction origin", true);
        }

        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(amountToDeduct, amount.local.currency, ExTypes.Selling, false, 4);
        // calculate fee
        let feeAmount = 0;
        let feeObject = {};
        try {
            const { feeAmount: finalFeeAmount, ...rest } = await calculateFee(transactionType, amountToDeduct);
            feeAmount = convertToRequiredDecimalPlaces(finalFeeAmount);
            feeObject = {
                ...rest,
            };
        } catch (error) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, error.message, true);
        }

        const totalAfterAddingFee = convertToRequiredDecimalPlaces(Number(amountToDeduct) + Number(feeAmount));

        const userCard = isPomeloUser.cards.find((usrCard) => usrCard.cardId === card.id);
        if (!userCard) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "card not found.");
        }

        if (userCard.status !== PomeloCardBLockStatus.ACTIVE) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, `Your card status is ${userCard.status}`, true);
        }

        if (userCard?.freezedByAdmin) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, `Your card is Freezed by Stable admin`, true);
        }
        const oneStableCoin = calculateOneStableCoin(exchangeAmount, totalAfterAddingFee);

        // save the transaction as transaction_cashin_card
        const payloadToSave = {
            userId: isPomeloUser.userId._id,
            pomeloUserId: user.id,
            card: {
                type: userCard.cardType,
                id: userCard.cardId,
                productType: card.product_type,
                lastFour: card.last_four,
            },
            transaction: {
                id: transaction.id,
                countryCode: transaction.country_code,
                type: transaction.type,
                pointType: transaction.point_type,
                entryMode: transaction.entry_mode,
                origin: transaction.origin,
                localDateTime: transaction.local_date_time,
                originalTransactionId: transaction.original_transaction_id,
            },
            merchant,
            localAmount: exchangeAmount,
            localAmountToSUSD: amountConvertedFromLocalCurrToSusd,
            amount: totalAfterAddingFee,
            pomeloWebhooksAmountDetails: {
                local: amount.local,
                transaction: amount.transaction,
                settlement: amount.settlement,
                details: amount.details,
            },
            userLastBalance: userBalance.balance,
            userUpdatedBalance: (userBalance.balance) - totalAfterAddingFee,
            status: Status.COMPLETED,
            type: TrnasactionsTypes.DEBIT,
            method: PomeloWebhookMethods.TRANSACTIONS_AUTHORIZATION_DEBIT,
            currentExchageRate: exchageRates,
            fee: {
                amount: feeAmount,
                oneStableCoin,
                ...feeObject,
            },
            userIpAddress,
            extraData,
        };

        // save the trantion in consolidatedTrasntions
        const globalTransTable = {
            userId: isPomeloUser.userId._id,
            amount: totalAfterAddingFee,
            status: Status.COMPLETED,
            transactionModel: StableModelsNames.CARD,
            transactionType: `${TransactionTypes.Card}|DEBIT`,
            localAmount: exchangeAmount,
            metaData: {
                currentExchageRate: exchageRates,
                fee: {
                    amount: feeAmount,
                    oneStableCoin,
                    localAmount: convertToRequiredDecimalPlaces(feeAmount * exchageRates.buying),
                },
            },
        };

        // before adding create a transaction in the database
        // lets start the mongodb session
        session = await mongoose.startSession();
        session.startTransaction();
        const opts = { session };
        // check if balance is not avaiable
        const payloadForNotification = { transaction, merchant, card, amount, exchageRates, totalAfterAddingFee, oneStableCoin, localAmount: exchangeAmount };
        if (totalAfterAddingFee > userBalance.balance) {
            payloadToSave.userUpdatedBalance = userBalance.balance;
            payloadToSave.status = Status.FAILED;

            const transactionPayloadToSave = new TransactionsCards(payloadToSave);
            globalTransTable.status = Status.FAILED;
            globalTransTable.transactionRefrenceId = transactionPayloadToSave._id;
            const globalData = new Transactions(globalTransTable);

            await globalData.save(opts);
            await transactionPayloadToSave.save(opts);
            await session.commitTransaction();
            session.endSession();
            const payload = {
                userId: isPomeloUser.userId._id,
                cardId: userCard.cardId,
                kyc: isPomeloUser.userId.kyc,
            };
            Event.emit(EventTypes.FailedCardTransactionCount, payload);
            const additionalDetailsForPushNoti = {
                notificationType: NotificationTypes.PaymentConfirmation,
                _id: transactionPayloadToSave._id,
                userId: isPomeloUser.userId._id,
                amount: transactionPayloadToSave.amount,
                localAmount: transactionPayloadToSave.localAmount,
                currency: transactionPayloadToSave.currency,
                status: Status.FAILED,
                createdAt: transactionPayloadToSave.createdAt,
                oneStableCoin: transactionPayloadToSave.fee.oneStableCoin,
                currentExchangeRate: exchageRates,
                tType: "card",
                type: "debit",
            };
            await sendNotification(Status.FAILED, isPomeloUser, payloadForNotification, additionalDetailsForPushNoti);
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.INSUFFICIENT_FUNDS, "User has insufficent funds", true);
        }

        // apply the main logic down here
        const isAmountValidToUpdate = Number(totalAfterAddingFee);
        if (!isAmountValidToUpdate && !(isAmountValidToUpdate <= 0)) {
            return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, `Not a valid amount to update ${isAmountValidToUpdate}`, true);
        }
        const payload = {
            userId: isPomeloUser.userId._id,
            status: payloadToSave.status,
            failedTransactionCardCount: isPomeloUser.failedTransactionCount,
        };
        Event.emit(EventTypes.FailedCardTransactionCount, payload);

        const extraPayload = {
            opts,
        };
        const balanceUpdateToUser = userBalance.userId;
        await updateBalance(balanceUpdateToUser, -totalAfterAddingFee, extraPayload);
        // save the transaction as transaction_cashin_card
        // find difference of exRate for profit
        const exRateCurrency = CountryCurrencies[isPomeloUser.userId?.country?.countryCode];
        const exRate = await ExchangeRates.findOne({ currency: exRateCurrency });
        const currencyId = exRate._id;
        const amountPlusFee = totalAfterAddingFee;
        const calculateExRateProfit = await calculateExchangeProfit(currencyId, amountPlusFee, exRate.selling, "amountIncSelling", feeAmount || 0);
        payloadToSave.metaData = {
            exRateDifference: calculateExRateProfit.amountToDeduct,
            exRateProfit: calculateExRateProfit.exRateProfit,
            totalProfit: calculateExRateProfit.totalProfit,
        };
        const transactionPayloadToSave = new TransactionsCards(payloadToSave);
        globalTransTable.transactionRefrenceId = transactionPayloadToSave._id;

        // save fee profit amount in seperate transactions
        const feeTransTable = {
            transactionRefrenceId: transactionPayloadToSave._id,
            transactionModel: StableModelsNames.CARD,
            amount: calculateExRateProfit.totalProfit,
            appType: Applications.STABLE_APP,
            transactionType: `${TransactionTypes.Card}`,
            metaData: {
                exRateDifference: calculateExRateProfit.amountToDeduct,
                exRateProfit: calculateExRateProfit.exRateProfit,
                stableFeeDetuction: 0,
                serviceFeeDetuction: 0,
            },
        };
        // before adding create a transaction in the database
        const feeTransTableData = new FeeTransactions(feeTransTable);

        // add amount in wallet
        await Wallet.updateOne(
            { $inc: { balance: calculateExRateProfit.totalProfit } },
        );
        await feeTransTableData.save(opts);
        const globalData = new Transactions(globalTransTable);
        await globalData.save(opts);
        await transactionPayloadToSave.save(opts);

        const additionalDetailsForPushNoti = {
            notificationType: NotificationTypes.PaymentConfirmation,
            _id: transactionPayloadToSave._id,
            userId: isPomeloUser.userId._id,
            amount: transactionPayloadToSave.amount,
            localAmount: transactionPayloadToSave.localAmount,
            currency: transactionPayloadToSave.currency,
            status: Status.COMPLETED,
            createdAt: transactionPayloadToSave.createdAt,
            oneStableCoin: transactionPayloadToSave.fee.oneStableCoin,
            currentExchangeRate: exchageRates,
            tType: "card",
        };
        await sendNotification(Status.COMPLETED, isPomeloUser, payloadForNotification, additionalDetailsForPushNoti);

        // log user notification
        const eventData = {
            userId: isPomeloUser.userId._id,
            message: await translateWithLenguageSpecifiedV1(Lenguages.English)("pemelo_transaction_debit", { totalAfterAddingFee: convertToRequiredDecimalPlaces(totalAfterAddingFee, 2) }),
            spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("pemelo_transaction_debit", { totalAfterAddingFee: convertToRequiredDecimalPlaces(totalAfterAddingFee, 2) }),
            title: NotificationTitles.Payment_Confirmation,
            type: NotificationTypes.PaymentConfirmation,
            userIpAddress,
        };
        Event.emit(EventTypes.Notification, eventData);
        // calculate api response time
        const timeTakenbyApi = moment().diff(executeApiWithtinTimeframe, "seconds");
        if (timeTakenbyApi > timeToRespond) {
            throw new Error("Api took to long to respond");
        }

        // finally abort the trasan
        await session.commitTransaction();
        session.endSession();

        const reponsePayload = {
            status: PomeloWebhookStatus.APPROVED,
            status_detail: PomeloWebhookStatusDetails.APPROVED,
            message: "OK",
        };
        return sendPomeloSuccessReponse(req, res, reponsePayload);
    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, error.message, true);
    }
};

export default authorizations;
