/* eslint-disable camelcase */
import moment from "moment";
import mongoose from "mongoose";
import { CountryCurrencies, ExTypes, FlagsWithColor, Lenguages, NotificationPriority, NotificationTypes, StableActiveCountryCodes, StableCurrencies, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import getAppConfig from "../../utils/getAppConfig.js";
import applyCurrencyExchangeRateOnAmount from "../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import generateUniqueId from "../../utils/generateUniqueId.js";
import callApi from "../../utils/callApi.js";
import logger from "../../logger/index.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import TransactionsCashOut from "../../models/directaCashout.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import Transactions from "../../models/transactions.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import capitalizeName from "../../utils/capitalizeName.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import updateBalance from "../../utils/balanceUpdate.js";
import getFeeAndFeeObjectV1 from "../../utils/exchangeRates/getFeeAndObjectV1.js";
import getUserCashinVolume from "../../utils/getUserCashinVolume.js";
import checkMoneyOutAndSoftBlockUser from "../../utils/fraudDetection/checkMoneyOutAndSoftBlockUser.js";

async function sendPushNotification(devices, title, message, additionalDetails) {
    const sendersActiveNotificationTokens = activeNotificationTokenOfUser(devices);

    await notificationsQueue.add("pushNotification", {
        title,
        message,
        tokens: sendersActiveNotificationTokens,
        additionalDetails,
    }, { priority: NotificationPriority.TWO });
}
async function onepayCashout(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };
    try {
        const { _id, kyc, fraudDetection, isUserHaveToUploadBankStatement, isBankStatementUploaded, userBalance, onepayCustomerId, devices, firstName, lastName, bankStatementVerification, flag } = req.user;
        const { translate, body: { amount: userAmount, account_id, title = "defaulte title", bankName, method = "TURBO", account_number }, userIpAddress } = req;
        const amount = convertToRequiredDecimalPlaces(userAmount);
        const countryCode = kyc?.countryCode;
        if (fraudDetection?.softBlock) throw new ApiError("Invalid Details", 400, translate("soft_block"), true);
        if (!onepayCustomerId) throw new ApiError("validation_error", 400, translate("customer_not_found"), true);
        if (countryCode !== StableActiveCountryCodes.COL) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        if (typeof amount !== "number" || amount === null) throw new ApiError("Invalid Amount", 400, translate("amount_invalid_numeric"), true);
        if (userBalance.balance < amount) throw new ApiError("Invalid amount", 400, translate("insufficient_balance"), true);
        if (!bankStatementVerification && isBankStatementUploaded) throw new ApiError("Invalid Credentials", 400, translate("documents_approval_pending"), true);
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        const { fraudDetection: { durationMinutes, percentageThreshold, highCashinAmountToCheck } } = app;
        if (!bankStatementVerification && isUserHaveToUploadBankStatement) throw new ApiError("Invalid Details", 400, translate("document_verification_required", { type: "cash-out" }), true);
        if (amount < app.cashout.minLimit) throw new ApiError("Invalid Amount", 400, translate("cashout_minimum_amount", { minimumAmount: app.cashout.minLimit }), true);
        if (amount > app.cashout.maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashout_maximum_amount", { amount: app.cashout.maxLimit }), true);
        const checkIfUserBlocked = await checkMoneyOutAndSoftBlockUser(_id, amount, durationMinutes, percentageThreshold, highCashinAmountToCheck, "cash-out");
        if (checkIfUserBlocked) throw new ApiError("invalid details", 400, translate("soft_block"), true);
        // now apply exchange rates
        const feeObject = await getFeeAndFeeObjectV1(amount, "ONEPAY", "CASHOUT", "COL");
        const { amount: feeAmount } = feeObject;
        const finalAmountAfterFeeInSUSD = Number(amount) - Number(feeAmount);
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, false, 0);
        const exchageRates = await getExchangeRate(CountryCurrencies[countryCode]);

        const apiBody = {
            title,
            customer_id: onepayCustomerId,
            amount: Number(exchangeAmount),
            account_id,
            currency: CountryCurrencies[countryCode],
            method,
        };
        const invoiceId = generateUniqueId("onepay");
        const Headers = {
            accept: "application/json",
            "x-idempotency": invoiceId,
            "content-type": "application/json",
        };
        logger.info(` cashout request body :: ${JSON.stringify(apiBody)}`);
        const result = await callApi.onepay("onepay", "onepayCashout", "post", apiBody, false, Headers);
        if (!result.success) {
            logger.error(`onePay cashout error :: ${result.message}`);
            throw new ApiError("Error in onePay Api", 400, translate("something_went_wrong"), true);
        }
        const { id } = result.results;
        const transactionStaus = Status.PENDING;
        const updatedBalance = userBalance.balance - amount;
        const oneStableCoin = calculateOneStableCoin(exchangeAmount, amount);
        const time = moment().utc();
        const statusHistory = [{
            status: transactionStaus,
            time,
        }];
        const transacciondata = {
            userId: _id,
            amount, // must be a string
            localAmount: exchangeAmount,
            currency: CountryCurrencies[countryCode],
            invoiceId,
            cashoutId: id,
            status: transactionStaus,
            statusHistory,
            transactionType: "debit",
            userIpAddress,
            type: "ONEPAY",
            bankName,
            userLastBalance: userBalance.balance,
            userUpdatedBalance: updatedBalance,
            currentExchageRate: exchageRates,
            fee: {
                ...feeObject,
                oneStableCoin,
            },
        };

        const createDirectaInvoice = new TransactionsCashOut(transacciondata);
        const { _id: tId, localAmount } = createDirectaInvoice;
        // save the trantion in consolidatedTrasntions
        const globalTransTable = {
            transactionRefrenceId: tId,
            userId: _id,
            amount,
            status: transactionStaus,
            transactionModel: StableModelsNames.CASHOUT,
            transactionType: `${TransactionTypes.Cashout}|ONEPAY`,
            localAmount,
            metaData: {
                currentExchageRate: exchageRates,
                fee: {
                    amount: feeAmount,
                    oneStableCoin,
                    localAmount: convertToRequiredDecimalPlaces(feeAmount * exchageRates.selling),
                    serviceFee: feeObject.serviceFeeDetuction,
                    stableFee: feeObject.stableFeeDetuction,
                },
            },
        };

        // before adding create a transaction in the database
        const globalData = new Transactions(globalTransTable);
        await createDirectaInvoice.save(opts);
        await globalData.save(opts);
        const extraPayload = {
            opts,
            translate,
        };
        const balanceUpdateToUser = userBalance.userId;
        await updateBalance(balanceUpdateToUser, -amount, extraPayload);
        const responseData = { ...result.results, oneStableCoin, localAmount: exchangeAmount };
        await session.commitTransaction();
        session.endSession();
        const language = req.headers["accept-language"];
        const notificationTitle = translate("cashout_title", { amount: convertToRequiredDecimalPlaces(amount, 2) });
        const notificationMessage = translate("cashout_push_notification_message", { amount: convertToRequiredDecimalPlaces(amount, 2) });
        const payloadForPushNotification = {
            notificationType: NotificationTypes.PaymentConfirmation,
            _id: createDirectaInvoice._id,
            userId: _id,
            cashoutId: createDirectaInvoice.cashoutId,
            amount: createDirectaInvoice.amount,
            localAmount: createDirectaInvoice.localAmount,
            currency: createDirectaInvoice.currency,
            status: Status.PENDING,
            createdAt: createDirectaInvoice.createdAt,
            oneStableCoin: createDirectaInvoice.fee.oneStableCoin,
            currentExchangeRate: exchageRates,
            tType: "cashout",
            type: "cashout",
        };
        await sendPushNotification(devices, notificationTitle, notificationMessage, payloadForPushNotification);

        const bankname = bankName;
        const emailTemplate = language === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
        const date = moment().tz("America/Bogota").format("YYYY-MM-DD"); // should be the user timezone
        const emailTime = moment().tz("America/Bogota").format("HH:mm a");

        const emailPayload = { type: language === Lenguages.Spanish ? "Solicitud de retiro" : "Withdrew request", tType: "Cashout", amount: convertToRequiredDecimalPlaces(amount, 2), localAmount: convertToRequiredDecimalPlaces(exchangeAmount, 2), date, time: emailTime, exchageRate: convertToRequiredDecimalPlaces(oneStableCoin, 2), accountNumber: account_number, fullName, bankname };
        await sendEmailOrMessageV3({ email: req.user.email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Solicitud de retiro de efectivo" : "Cashout request", templates: chooseEmailTemplateAndMessage(emailTemplate, false, emailPayload) });
        return sendSuccessResponse(res, 200, true, translate("invoice_created_success"), "onepay", responseData);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return next(error);
    }
}

export default onepayCashout;
