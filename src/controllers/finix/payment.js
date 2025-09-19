import mongoose from "mongoose";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import print from "../../utils/print.js";
import ENV from "../../config/keys.js";
import { ApiError } from "../../utils/ApiError.js";
import CashinTransactionsV1 from "../../models/transactionsCashinsV1.js";
import { NotificationPriority, Stable, StableMaximumUSD, StableMinimumUSD, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
import PaymentInstrument from "../../models/paymentInstrument.js";
import Users from "../../models/users.js";
import logger from "../../logger/index.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import getFromCache from "../../utils/cache/getFromCache.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import getFeeAndFeeObject from "../../utils/exchangeRates/getFeeAndObject.js";
import finixClient from "../../config/finixClient.js";
import Transactions from "../../models/transactions.js";

async function FinixPayment(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  const opts = { session, returnDocument: "after", new: true };
  try {
    const { user, translate, userIpAddress, body: { amount, instrumentId } } = req;
    const { _id } = user;

    if (!isValidMdbId(instrumentId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "Instrument" }), true);
    if (amount < StableMinimumUSD.CASHIN) throw new ApiError("Invalid Amount", 400, translate("cashin_minimum_amount"), true);
    if (amount > StableMaximumUSD.CASHIN) throw new ApiError("Invalid Amount", 400, translate("cashin_maximum_amount", { amount: StableMaximumUSD.CASHIN }), true);
    const instrument = await PaymentInstrument.findOne({ _id: instrumentId, userId: _id });
    if (!instrument) throw new ApiError("invalid Credentials", 400, translate("instrument_not_found"), true);
    if (instrument.disable) throw new ApiError("invalid Credentials", 400, translate("instrument_disable"), true);

    const { sourceId, fraudSessionId } = instrument;
    const feeObject = await getFeeAndFeeObject(amount, "FINIX", "CASHIN", "USA");
    let { amount: totalFee } = feeObject;
    const flatFee = await getFromCache("finix-fee");
    if (flatFee) {
      totalFee += flatFee;
    } else {
      totalFee += 0.3;
    }
    feeObject.amount = totalFee;
    let finalAmountAfterFeeInSUSD = Number(amount) + Number(feeObject.amount);
    finalAmountAfterFeeInSUSD = convertToRequiredDecimalPlaces(finalAmountAfterFeeInSUSD, 4);
    const oneStableCoin = calculateOneStableCoin(finalAmountAfterFeeInSUSD, amount);
    finalAmountAfterFeeInSUSD *= 100; // for converting usd to cents
    const payment = {
      merchant: ENV.FINIX.MERCHANT,
      currency: "USD",
      amount: finalAmountAfterFeeInSUSD,
      source: sourceId,
      fraud_session_id: fraudSessionId,
    };
    let result;
    try {
      result = await finixClient.Transfers.create(payment);
    } catch (error) {
      logger.error(`Finix :: ${error.response.body._embedded.errors[0].message}`);
      throw new ApiError("Finix api error", 400, translate("something_went_wrong"), true);
    }
    const { id, amount: finalAmount, traceId, securityCodeVerification, destination, additionalBuyerCharges, failureMessage, failureCode, readyToSettleAt, externallyFunded, state, fee, feeType, statementDescriptor, type, messages, idempotencyId, subtype } = result;
    if (state !== Status.SUCCEEDED) {
      logger.error(`Finix :: ${failureCode} : ${failureMessage}`);
      throw new ApiError("Finix api error", 400, translate("something_went_wrong"), true);
    }
    const updatedUser = await Users.findOneAndUpdate({ _id }, { $inc: { balance: Number(amount) } }, opts);
    const exchageRates = await getExchangeRate("USD");
    const userUpdatedBalance = updatedUser?.balance;
    const userLastBalance = user?.balance;

    const paymentInfo = {
      traceId,
      destination,
      readyToSettleAt,
      externallyFunded,
      securityCodeVerification,
      fee,
      statementDescriptor,
      type,
      messages,
      idempotencyId,
      subtype,
      state,
      feeType,
      additionalBuyerCharges,
    };
    const invoivcedata = {
      userId: _id,
      invoiceId: id,
      depositId: sourceId,
      amount,
      localAmount: amount,
      description: Stable,
      status: Status.COMPLETED,
      transactionType: "credit",
      currency: "USD",
      type: "finix-card",
      currentExchangeRate: exchageRates,
      userLastBalance,
      userUpdatedBalance,
      paymentInfo,
      userIpAddress,
      fee: {
        ...feeObject,
        oneStableCoin,
        stableFeeDetuctionLocal: feeObject.stableFeeDetuction,
        serviceFeeDetuctionLocal: feeObject.serviceFeeDetuction,
        localAmount: feeObject.amount,
      },
    };
    const newInvoice = new CashinTransactionsV1(invoivcedata);
    const { _id: tId, localAmount: amountLocal } = newInvoice;
    // save the trantion in consolidatedTrasntions
    const globalTransTable = {
      transactionRefrenceId: tId,
      userId: _id,
      amount,
      status: Status.COMPLETED,
      transactionModel: StableModelsNames.CASHIN_V1,
      transactionType: `${TransactionTypes.Cashin}|FINIX`,
      localAmount: amountLocal,
      metaData: {
        currentExchageRate: exchageRates,
        fee: {
          amount: feeObject.amount,
          serviceFee: feeObject.serviceFeeDetuction,
          stableFee: feeObject.stableFeeDetuction,
        },
      },
    };

    // before adding create a transaction in the database
    const globalData = new Transactions(globalTransTable);

    // save fee profit amount in seperate transactions
    await newInvoice.save(opts);
    await globalData.save(opts);

    await session.commitTransaction();
    session.endSession();
    const userActiveNotificationToken = activeNotificationTokenOfUser(user.devices);
    const payloadForPushNotification = {
      _id: newInvoice._id,
      depositId: newInvoice.depositId,
      amount: newInvoice.amount,
      cashinSuccess: true,
      localAmount: newInvoice.localAmount,
      currency: newInvoice.currency,
      status: Status.COMPLETED,
      createdAt: newInvoice.createdAt,
      oneStableCoin,
    };
    await notificationsQueue.add("pushNotification", {
      title: "FINIX",
      message: translate("payment_success_response", { amount: convertToRequiredDecimalPlaces(newInvoice.amount, 2) }),
      tokens: userActiveNotificationToken,
      additionalDetails: payloadForPushNotification,
    }, { priority: NotificationPriority.TWO });

    return sendSuccessResponse(res, 200, true, translate("create_payment_success"), "create payment", result);
  } catch (error) {
    print("warn", error.message);
    logger.error(`Reverting the transaction`);
    logger.error(error.message);
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}

export default FinixPayment;
