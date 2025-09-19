import mongoose from "mongoose";
import moment from "moment-timezone";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import TransactionsP2P from "../../models/transactionsP2Ps.js";
import Transactions from "../../models/transactions.js";
import { EventTypes, Lenguages, NotificationTitles, NotificationTypes, Status, feeTypes, CountryCurrencies, StableModelsNames, TransactionTypes, Applications, FlagsWithColor, ScoreKeys } from "../../constants/index.js";
import Event from "../../Events/databaseLogs.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import ExchangeRates from "../../models/exchangeRates.js";
import calculateFee from "../../utils/calculateFee.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import capitalizeName from "../../utils/capitalizeName.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import sendPushNotificationToBothSenderAndReciever from "./notificationHelper.js";
import User from "../../models/users.js";
import updateBalance from "../../utils/balanceUpdate.js";
import FeeTransactions from "../../models/feeTransaction.js";
import Wallet from "../../models/feeWallet.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import getAppConfig from "../../utils/getAppConfig.js";
import getUserCashinVolume from "../../utils/getUserCashinVolume.js";
import checkMoneyOutAndSoftBlockUser from "../../utils/fraudDetection/checkMoneyOutAndSoftBlockUser.js";
import logger from "../../logger/index.js";
import ScoreHistory from "../../models/scoreHistory.js";

async function makeTransaction(req, res, next) {
   const session = await mongoose.startSession();
   session.startTransaction();
   const opts = { session, returnDocument: "after", new: true };
   const { _id, bankStatementVerification, isUserHaveToUploadBankStatement, isBankStatementUploaded, fraudDetection, flag, phoneNumber: SenderPhoneNumber, country: { countryCode }, userBalance } = req.user;
   const { phoneNumber, amount: userAmount, description = "default description" } = req.body;
   const amount = convertToRequiredDecimalPlaces(userAmount);
   // use transations
   try {
      const { translate, userIpAddress } = req;
      if (fraudDetection?.softBlock) throw new ApiError("Invalid Details", 400, translate("soft_block"), true);
      if (typeof amount !== "number") throw new ApiError("invalid details", 400, translate("invalid_amount"), true);
      if (SenderPhoneNumber === phoneNumber) throw new ApiError("invalid details", 400, translate("same_sender_receiver"), true);
      if (!bankStatementVerification && isBankStatementUploaded) throw new ApiError("Invalid Credentials", 400, translate("documents_approval_pending"), true);
      const app = await getAppConfig();
      if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
      const { fraudDetection: { durationMinutes, percentageThreshold, highCashinAmountToCheck } } = app;
      if (!bankStatementVerification && isUserHaveToUploadBankStatement) throw new ApiError("Invalid Details", 400, translate("document_verification_required", { type: "P2P" }), true);
      if (convertToRequiredDecimalPlaces(amount) <= 0) throw new ApiError("invalid details", 400, translate("invalid_amount"), true);

      const checkIfUserBlocked = await checkMoneyOutAndSoftBlockUser(_id, amount, durationMinutes, percentageThreshold, highCashinAmountToCheck, "p2p");
      if (checkIfUserBlocked) throw new ApiError("invalid details", 400, translate("soft_block"), true);
      // get sender data
      const sender = req.user;

      // get receiver data
      const receiver = await User.findOne({ phoneNumber, isVerified: true }).populate({ path: "userBalance", select: "userId balance" }).lean();
      if (!receiver) throw new ApiError("invalid details", 400, translate("no_stable_account"), true);
      if (!receiver.userBalance) {
         throw new ApiError(translate("Access denied"), 401, translate("user_balance_not_found"), true);
      }

      const { country: { countryCode: receiverCountryCode } } = receiver;
      const exchageRates = await ExchangeRates.findOne({ currency: CountryCurrencies[countryCode] });
      if (!exchageRates) {
         throw new ApiError("invalid request", 400, translate("exchange_rate_not_found", { currency: CountryCurrencies[countryCode] }), true);
      }
      const receiverExchageRates = await ExchangeRates.findOne({ currency: CountryCurrencies[receiverCountryCode] });
      if (!receiverExchageRates) {
         throw new ApiError("invalid request", 400, translate("exchange_rate_not_found", { currency: CountryCurrencies[receiverCountryCode] }), true);
      }
      if (userBalance.balance < amount) {
         throw new ApiError("invalid details", 400, translate("insufficient_balance"), true);
      }

      let transactionType = feeTypes.P2P_TRANSACTION_LOCAL;
      if (sender?.country?.country !== receiver?.country?.country) {
         transactionType = feeTypes.P2P_TRANSACTION_INTERNATIONAL;
      }

      // calculate fee
      let feeAmount = 0;
      let feeObject = {};
      try {
         const { feeAmount: finalFeeAmount, ...rest } = await calculateFee(transactionType, amount);
         feeAmount = convertToRequiredDecimalPlaces(finalFeeAmount);
         feeObject = {
            ...rest,
         };
      } catch (error) {
         throw new ApiError("Invalid details", 400, error.message, true);
      }

      const isSenderHaveFeeForTheAmount = feeAmount > (userBalance.balance - amount);
      if (isSenderHaveFeeForTheAmount) {
         throw new ApiError("Invalid Details", 400, translate("insufficient_fee_amount"), true);
      }
      // check last balance for both sender receiver
      const senderLastBalance = userBalance.balance;
      const receiverLastBalance = parseFloat(receiver.userBalance.balance);

      // update sender and receiver
      const extraPayloadForReceiver = {
         opts,
         translate,
      };
      const balanceUpdateToUser = receiver.userBalance?.userId;
      const updateToUser = await updateBalance(balanceUpdateToUser, amount, extraPayloadForReceiver);
      await User.findOneAndUpdate({ _id: receiver._id }, { $inc: { minimumBalance: amount } }, opts);

      const amountPlusFee = amount + feeAmount;
      const extraPayloadForSender = {
         opts,
         translate,
      };
      const balanceUpdateFromUser = userBalance.userId;
      const updateFromUser = await updateBalance(balanceUpdateFromUser, -amountPlusFee, extraPayloadForSender);
      const oneStableCoin = calculateOneStableCoin(amountPlusFee, amount);

      // check whether updation has been successfull
      if (!updateFromUser) {
         throw new Error("Error in updating sender balance");
      }
      if (!updateToUser) {
         throw new Error("Error in updating receiver balance");
      }

      // sender and receiver updated balance
      const senderUpdatedBalance = updateFromUser.balance;
      const receiverUpdatedBalance = updateToUser.balance;

      const transaction = {
         from: sender._id,
         to: receiver._id,
         amount: amountPlusFee,
         receiverAmount: amount,
         description,
         status: Status.COMPLETED,
         fee: {
            amount: feeAmount,
            oneStableCoin,
            ...feeObject,
         },
         transactionType,
         localAmount: exchageRates.selling * amountPlusFee,
         receiverLocalAmount: receiverExchageRates.selling * amount,
         currentExchageRate: exchageRates,
         receiverCurrentExchageRate: receiverExchageRates,
         senderLastBalance,
         receiverLastBalance,
         senderUpdatedBalance,
         receiverUpdatedBalance,
         userIpAddress,
      };
      // before adding create a transaction in the database
      const createTransaction = new TransactionsP2P(transaction);

      const { _id: p2pId, localAmount } = createTransaction;

      // save fee profit amount in seperate transactions
      const feeTransTable = {
         transactionRefrenceId: p2pId,
         transactionModel: StableModelsNames.P2P,
         amount: feeAmount,
         appType: Applications.STABLE_APP,
         transactionType: TransactionTypes.P2P,
         metaData: {
            exRateDifference: 0,
            exRateProfit: 0,
            stableFeeDetuction: 0,
            serviceFeeDetuction: 0,
         },
      };
      // before adding create a transaction in the database
      const feeTransTableData = new FeeTransactions(feeTransTable);

      // save the trantion in consolidatedTrasntions
      const globalTransTable = {
         transactionRefrenceId: p2pId,
         from: sender._id,
         to: receiver._id,
         amount: amountPlusFee,
         receiverAmount: amount,
         receiverLocalAmount: receiverExchageRates.selling * amount,
         status: Status.COMPLETED,
         transactionModel: StableModelsNames.P2P,
         transactionType: TransactionTypes.P2P,
         localAmount,
         metaData: {
            fee: {
               amount: feeAmount,
               oneStableCoin,
               localAmount: convertToRequiredDecimalPlaces(feeAmount * exchageRates.selling),
            },
            currentExchageRate: exchageRates,
            receiverCurrentExchageRate: receiverExchageRates,
         },
      };
      // before adding create a transaction in the database
      const globalData = new Transactions(globalTransTable);

      await Wallet.updateOne(
         { $inc: { balance: feeAmount } },
      );

      if (!createTransaction) throw new ApiError("invalid_details", 400, translate("transaction_creation_error"), true);
      if (!globalData) throw new ApiError("invalid_details", 400, translate("transaction_creation_error"), true);
      if (!feeTransTableData) throw new ApiError("invalid_details", 400, translate("transaction_creation_error"), true);
      await createTransaction.save(opts);
      await globalData.save(opts);
      await feeTransTableData.save(opts);
      await session.commitTransaction();
      session.endSession();
      // now send notification to sender and reciever
      const payloadForPushNotification = {
         notificationType: NotificationTypes.PaymentConfirmation,
         _id: createTransaction._id,
         amount: createTransaction.amount,
         userId: _id,
         localAmount: createTransaction.localAmount,
         receiverLocalAmount: createTransaction.receiverLocalAmount,
         from: {
            firstName: sender.firstName,
            lastName: sender.lastName,
            email: sender.email,
            phoneNumber: sender.phoneNumber,
         },
         to: {
            firstName: receiver.firstName,
            lastName: receiver.lastName,
            email: receiver.email,
            phoneNumber: receiver.phoneNumber,
         },
         currency: createTransaction.currency || "COP",
         status: Status.COMPLETED,
         createdAt: createTransaction.createdAt,
         oneStableCoin: createTransaction.fee.oneStableCoin,
         currentExchangeRate: exchageRates,
         tType: "p2p",
         type: "debit",
      };
      await sendPushNotificationToBothSenderAndReciever(sender, receiver, convertToRequiredDecimalPlaces(amount, 2), convertToRequiredDecimalPlaces(amountPlusFee, 2), payloadForPushNotification);

      // log this transation as user in-app notification
      const senderNotiData = {
         userId: sender._id,
         message: await translateWithLenguageSpecifiedV1(Lenguages.English)("transfer_sender_notification", { firstName: capitalizeName(receiver.firstName), amount: convertToRequiredDecimalPlaces(amount, 2) }),
         spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("transfer_sender_notification", { firstName: capitalizeName(receiver.firstName), amount: convertToRequiredDecimalPlaces(amount, 2) }),
         title: NotificationTitles.Payment_Confirmation,
         type: NotificationTypes.PaymentConfirmation,
         userIpAddress,
      };
      const recieverNotifData = {
         userId: receiver._id,
         message: await translateWithLenguageSpecifiedV1(Lenguages.English)("transfer_receiver_notification", { firstName: capitalizeName(sender.firstName), amount: convertToRequiredDecimalPlaces(amount, 2) }),
         spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("transfer_receiver_notification", { firstName: capitalizeName(sender.firstName), amount: convertToRequiredDecimalPlaces(amount, 2) }),
         title: NotificationTitles.Payment_Confirmation,
         type: NotificationTypes.PaymentConfirmation,
      };

      Event.emit(EventTypes.Notification, senderNotiData);
      Event.emit(EventTypes.Notification, recieverNotifData);

      // send email notification
      const languageForSender = sender?.language ?? Lenguages.English;
      const emailTemplateForSender = languageForSender === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
      const languageForReciever = receiver?.language ?? Lenguages.English;
      const emailTemplateForReciever = languageForReciever === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
      const senderFullName = `${capitalizeName(sender.firstName)} ${capitalizeName(sender.lastName)}`;
      const receiverFullName = `${capitalizeName(receiver.firstName)} ${capitalizeName(receiver.lastName)}`;

      // format date
      const date = moment().tz("America/Bogota").format("YYYY-MM-DD");
      const time = moment().tz("America/Bogota").format("HH:mm a");
      const emailPayloadForSender = {
         type: languageForSender === Lenguages.Spanish ? "Retiraste" : "Withdrew Money",
         tType: "Cashout",
         transactionName: "P2P",
         amount: convertToRequiredDecimalPlaces(amountPlusFee, 2),
         localAmount: convertToRequiredDecimalPlaces(transaction.localAmount, 2),
         date,
         time,
         exchageRate: transaction.currentExchageRate.buying,
         receiverUserName: capitalizeName(receiverFullName),
         fullName: senderFullName,
      };
      const emailPayloadForReciever = {
         type: languageForReciever === Lenguages.Spanish ? "Agregaste" : "Added Money",
         tType: "cashin",
         amount: convertToRequiredDecimalPlaces(amount, 2),
         localAmount: convertToRequiredDecimalPlaces(transaction.localAmount, 2),
         date,
         time,
         exchageRate: transaction.currentExchageRate.buying,
         fullName: receiverFullName,
      };

      const transactionResponsePayload = {
         amount: amountPlusFee,
         oneStableCoin,
         localAmount: createTransaction.localAmount,
         status: Status.COMPLETED,
         transactionId: createTransaction._id,
         acquisitionCost: exchageRates.selling,
         accountNumber: receiver.phoneNumber,
         to: capitalizeName(receiverFullName),
      };
      const finalResponse = {
         ...transactionResponsePayload,
         email: sender.email,
         balance: updateFromUser.balance,
         _id: sender._id,
      };
      try {
         const checkIfFirstCashin = await ScoreHistory.findOne({ userId: receiver._id, code: ScoreKeys.FIRST_CASHIN });
         if (!checkIfFirstCashin) {
            // update user score
            const scoreData = {
               userId: receiver._id,
               code: ScoreKeys.FIRST_CASHIN,
            };
            Event.emit(EventTypes.UpdateUserScore, scoreData);
         }
         if (receiver.score <= (app.flag || 40)) {
            // update user score
            const scoreData = {
               userId: sender._id,
               code: ScoreKeys.FUND_TRANS_TO_SUSPICIOUS_USER,
            };
            Event.emit(EventTypes.UpdateUserScore, scoreData);
         }
      } catch (error) {
         logger.error(`error in update user score`);
      }
      await sendEmailOrMessageV3({ email: sender.email, onEmail: true, emailSubject: await translateWithLenguageSpecifiedV1(sender?.language)("p2p_email_subject_transaction_completed"), templates: chooseEmailTemplateAndMessage(emailTemplateForSender, false, emailPayloadForSender) });
      await sendEmailOrMessageV3({ email: receiver.email, onEmail: true, emailSubject: await translateWithLenguageSpecifiedV1(receiver?.language)("p2p_email_subject_money_recieved"), templates: chooseEmailTemplateAndMessage(emailTemplateForReciever, false, emailPayloadForReciever) });
      return sendSuccessResponse(res, 200, true, translate("transaction_completed"), "transactionProcessed", finalResponse);
   } catch (error) {
      await session.abortTransaction();
      session.endSession();
      next(error);
   }
   return false;
}

export default makeTransaction;
