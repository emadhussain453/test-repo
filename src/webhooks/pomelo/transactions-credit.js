import mongoose from "mongoose";
import moment from "moment";
import { POMELO_IP_ADDRESSES, PomeloTransactionOrigin, PomeloWebhookMethods, PomeloWebhookStatus, PomeloWebhookStatusDetails, Status, TrnasactionsTypes, EventTypes, Lenguages, NotificationTitles, NotificationTypes, StableModelsNames, TransactionTypes } from "../../constants/index.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import PomeloUsers from "../../models/pomeloUser.js";
import TransactionsCards from "../../models/transactionsCards.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import sendErrorResponse from "../../utils/pomelo/sendErrorResponse.js";
import sendPomeloSuccessReponse from "../../utils/pomelo/sendPomeloSuccessReponse.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import Event from "../../Events/databaseLogs.js";
import capitalizeName from "../../utils/capitalizeName.js";
import Transactions from "../../models/transactions.js";
import UserBalance from "../../models/userBalance.js";
import updateBalance from "../../utils/balanceUpdate.js";

const transactionsCredit = async (req, res, next) => {
  const timeToRespond = 4; // secondds
  const session = await mongoose.startSession();
  session.startTransaction();
  const opts = { session };
  const executeApiWithtinTimeframe = moment();
  try {
    const { body: { transaction, merchant, card, user, amount }, userIpAddress } = req;

    if (process.env.NODE_ENV === "production") {
      if (!POMELO_IP_ADDRESSES.includes(req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "Invalid Ip address");
    }

    // find pomelo user
    const isPomeloUser = await PomeloUsers.findOne({ pomeloUserId: user.id }).populate({
      path: "userId",
      select: "isBlocked balance isVerified language devices email phoneNumber firstName lastName notificationCount country",
    });
    if (!isPomeloUser) {
      return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "User not found.");
    }
    if (amount.settlement.total < 0 || amount.local.total < 0) {
      return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.INSUFFICIENT_FUNDS, "Amount is less then 0", true);
    }
    const userBalance = await UserBalance.findOne({ userId: isPomeloUser.userId._id });
    if (!userBalance) {
      return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "User balance not found");
    }
    let amountToAdd = 0;

    const userCard = isPomeloUser.cards.find((usrCard) => usrCard.cardId === card.id);
    if (!userCard) {
      const checkInDisableCards = isPomeloUser?.disableCards?.find((usrCard) => usrCard.cardId === card.id);
      if (!checkInDisableCards) {
        return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "card not found.");
      }
    }
    const currentExchageRate = await getExchangeRate(amount.local.currency);
    if (!currentExchageRate) {
      return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "Exchange rate not available", true);
    }

    if (transaction.origin === PomeloTransactionOrigin.INTERNATIONAL) {
      amountToAdd = Number(amount.settlement.total);
    } else if (transaction.origin === PomeloTransactionOrigin.DOMESTIC) {
      let amountConvertedFromLocalCurrToSusd = amount.local.total / currentExchageRate.selling;
      amountConvertedFromLocalCurrToSusd = convertToRequiredDecimalPlaces(amountConvertedFromLocalCurrToSusd, 4);
      amountToAdd = amountConvertedFromLocalCurrToSusd;
    } else {
      return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, "Invalid transaction origin", true);
    }

    const isAmountValidToUpdate = Number(amountToAdd);
    if (!isAmountValidToUpdate && !(isAmountValidToUpdate <= 0)) {
      return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, `Not a valid amount to update ${isAmountValidToUpdate}`, true);
    }

    const extraPayload = {
      opts,
    };
    const balanceUpdateToUser = userBalance.userId;
    const updatedUser = await updateBalance(balanceUpdateToUser, amountToAdd, extraPayload);

    const oneStableCoin = currentExchageRate.selling;
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
      localAmount: amount.local.total,
      amount: amountToAdd,
      pomeloWebhooksAmountDetails: {
        local: amount.local,
        transaction: amount.transaction,
        settlement: amount.settlement,
        details: amount.details,
      },
      userLastBalance: userBalance.balance,
      userUpdatedBalance: updatedUser.balance,
      status: Status.COMPLETED,
      type: TrnasactionsTypes.CREDIT,
      method: PomeloWebhookMethods.TRANSACTIONS_CREDIT,
      currentExchageRate,
      userIpAddress,
      fee: {
        oneStableCoin,
      },
    };

    const transactionPayloadToSave = new TransactionsCards(payloadToSave);
    const { _id: tId, localAmount: amountLocal } = transactionPayloadToSave;
    // save the trantion in consolidatedTrasntions
    const globalTransTable = {
      transactionRefrenceId: tId,
      userId: isPomeloUser.userId._id,
      amount: amountToAdd,
      status: Status.COMPLETED,
      transactionModel: StableModelsNames.CARD,
      transactionType: `${TransactionTypes.Card}|CREDIT`,
      localAmount: amountLocal,
      metaData: {
        currentExchageRate,
        fee: {
          oneStableCoin,
        },
      },
    };

    // before adding create a transaction in the database
    const globalData = new Transactions(globalTransTable);

    await globalData.save(opts);
    await transactionPayloadToSave.save(opts);

    // send notifications
    const userDevices = isPomeloUser.userId.devices;
    const title = isPomeloUser.userId?.language === "es" ? "Reeembolso 🎉" : "Refund 🎉";
    const userActiveNotificationToken = activeNotificationTokenOfUser(userDevices);
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
      currentExchangeRate: currentExchageRate,
      tType: "card",
      type: "credit",
    };
    const pushNotificationPayload = {
      title,
      message: await translateWithLenguageSpecifiedV1(isPomeloUser.userId?.language)("pemelo_transaction_credit", { amount: convertToRequiredDecimalPlaces(amountToAdd, 2) }),
      tokens: userActiveNotificationToken,
      additionalDetails: additionalDetailsForPushNoti,
    };
    const fullName = `${capitalizeName(isPomeloUser.userId.firstName)} ${capitalizeName(isPomeloUser.userId.lastName)}`;
    const [date, time] = transaction.local_date_time.split("T");
    const additionalData = {
      fullName,
      purchase: merchant.name,
      date,
      time,
      amount: convertToRequiredDecimalPlaces(amountToAdd, 2),
      localAmount: convertToRequiredDecimalPlaces(amount.local.total, 2),
      type: transaction.type,
      cardNumber: card.last_four,
      exchangeRate: convertToRequiredDecimalPlaces(currentExchageRate.selling, 2),
    };
    const notificationData = { isPomeloUser, additionalData, pushNotificationPayload, transaction, status: Status.COMPLETED };
    Event.emit(EventTypes.PomeloCardNotification, notificationData);

    // log user notification
    const eventData = {
      userId: isPomeloUser.userId._id,
      message: await translateWithLenguageSpecifiedV1(Lenguages.English)("pemelo_transaction_credit", { amount: convertToRequiredDecimalPlaces(amountToAdd, 2) }),
      spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("pemelo_transaction_credit", { amount: convertToRequiredDecimalPlaces(amountToAdd, 2) }),
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

    // finally abort the transactions
    await session.commitTransaction();
    session.endSession();

    const reponsePayload = {
      status: PomeloWebhookStatus.APPROVED,
      status_detail: PomeloWebhookStatusDetails.APPROVED,
      message: "OK",
    };
    return sendPomeloSuccessReponse(req, res, reponsePayload);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return sendErrorResponse(req, res, PomeloWebhookStatus.REJECTED, PomeloWebhookStatusDetails.OTHER, error.message);
  }
};

export default transactionsCredit;
