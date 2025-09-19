/* eslint-disable camelcase */
import moment from "moment";
import mongoose from "mongoose";
import { CountryCurrencies, ExTypes, KushkiWebhookEvents, Lenguages, NotificationPriority, NotificationTypes, StableActiveCountryCodes, StableCurrencies, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import applyCurrencyExchangeRateOnAmount from "../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import generateUniqueId from "../../utils/generateUniqueId.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import logger from "../../logger/index.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import capitalizeName from "../../utils/capitalizeName.js";
import ENV from "../../config/keys.js";
import getFeeAndFeeObjectV1 from "../../utils/exchangeRates/getFeeAndObjectV1.js";
import Transactions from "../../models/transactions.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import getAppConfig from "../../utils/getAppConfig.js";
import checkMoneyOutAndSoftBlockUser from "../../utils/fraudDetection/checkMoneyOutAndSoftBlockUser.js";
import updateBalance from "../../utils/balanceUpdate.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import TransactionsCashOut from "../../models/directaCashout.js";

async function sendPushNotification(devices, title, message, additionalDetails) {
    const sendersActiveNotificationTokens = activeNotificationTokenOfUser(devices);

    await notificationsQueue.add("pushNotification", {
        title,
        message,
        tokens: sendersActiveNotificationTokens,
        additionalDetails,
    }, { priority: NotificationPriority.TWO });
}

async function kushkiCashoutEffecty(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };
    try {
        const { translate, userIpAddress } = req;
        const { amount: userAmount, description = "default description" } = req.body;
        const { _id, kyc, email, language, phoneNumber, fraudDetection, isUserHaveToUploadBankStatement, isBankStatementUploaded, userBalance, devices, firstName, lastName, bankStatementVerification } = req.user;
        const countryCode = kyc?.countryCode;
        const amount = convertToRequiredDecimalPlaces(userAmount);
        if (fraudDetection?.softBlock) throw new ApiError("Invalid Details", 400, translate("soft_block"), true);

        if (countryCode !== StableActiveCountryCodes.COL) {
            // throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        if (!kyc?.documentType || !kyc?.documentIdNumber) {
            throw new ApiError("validation_error", 400, translate("missing_document_details"), true);
        }
        if (typeof amount !== "number" || amount === null || amount < 0) throw new ApiError("Invalid Amount", 400, translate("amount_invalid_numeric"), true);
        if (userBalance.balance < amount) throw new ApiError("Invalid amount", 400, translate("insufficient_balance"), true);
        if (!bankStatementVerification && isBankStatementUploaded) throw new ApiError("Invalid Credentials", 400, translate("documents_approval_pending"), true);
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        const { cashout: { minLimit, maxLimit }, fraudDetection: { durationMinutes, percentageThreshold, highCashinAmountToCheck } } = app;
        if (!bankStatementVerification && isUserHaveToUploadBankStatement) throw new ApiError("Invalid Details", 400, translate("document_verification_required", { type: "cash-out" }), true);
        if (amount < minLimit) throw new ApiError("Invalid Amount", 400, translate("cashout_minimum_amount", { minimumAmount: app.cashout.minLimit }), true);
        if (amount > maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashout_maximum_amount", { amount: app.cashout.maxLimit }), true);
        const checkIfUserBlocked = await checkMoneyOutAndSoftBlockUser(_id, amount, durationMinutes, percentageThreshold, highCashinAmountToCheck, "cash-out");
        if (checkIfUserBlocked) throw new ApiError("invalid details", 400, translate("soft_block"), true);
        const feeObject = await getFeeAndFeeObjectV1(amount, "KUSHKI", "CASHOUT", countryCode);
        const { amount: feeAmount } = feeObject;
        const finalAmountAfterFeeInSUSD = Number(amount) - Number(feeAmount);
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, false, 0);
        const exchageRates = await getExchangeRate(CountryCurrencies[countryCode]);
        const oneStableCoin = calculateOneStableCoin(exchangeAmount, amount);
        const invoiceId = generateUniqueId("kushki");

        const tokenHeaders = {
            "public-merchant-id": ENV.KUSKHI.KUSHKI_PUBLIC_KEY,
        };
        let documentType = kyc?.d24DocumentType;
        if (documentType === "PASS") documentType = "PP";
        const createTokenApiBody = {
            totalAmount: Number(exchangeAmount),
            currency: CountryCurrencies[countryCode],
            documentType,
            documentNumber: kyc?.documentIdNumber,
            phoneNumber,
            description,
            name: firstName,
            lastName,
            email,
        };

        const createTokenResult = await callApi.kushki("kushki", "createCashoutToken", "post", createTokenApiBody, false, tokenHeaders);

        if (!createTokenResult.success) {
            logger.error(`kushki error :: ${createTokenResult.message}`);
            throw new ApiError("Error in kushki token api", 400, translate("something_went_wrong"), true);
        }
        const apiBody = {
            token: createTokenResult.results.token,
            amount: { subtotalIva: 0, subtotalIva0: Number(exchangeAmount), iva: 0 },
            webhooks: [
                {
                    events: Object.values(KushkiWebhookEvents),
                    headers: [
                        {
                            label: "json",
                            value: "12",
                        },
                    ],
                    urls: [
                        ENV.KUSKHI.CASHOUT_WEBHOOK_URL,
                    ],
                },
            ],
        };
        const Headers = {
            "Private-Merchant-Id": ENV.KUSKHI.KUSHKI_PRIVATE_KEY,
        };
        const result = await callApi.kushki("kushki", "createCashoutEffecty", "post", apiBody, false, Headers);
        if (!result.success) {
            logger.error(`kushki error :: ${result.message}`);
            throw new ApiError("Error in kushki init txn api", 400, translate("something_went_wrong"), true);
        }
        const { transactionReference: id, ticketNumber, pin } = result.results;

        const transactionStaus = Status.PENDING;
        const updatedBalance = userBalance.balance - amount;
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
            type: "effecty",
            bankName: "effecty",
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
            transactionType: `${TransactionTypes.Cashout}|effecty`,
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
            bankName: "Effecty",
            tType: "cashout",
            type: "cashout",
        };
        await sendPushNotification(devices, notificationTitle, notificationMessage, payloadForPushNotification);

        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
        const effectyEmailTemplate = language === Lenguages.Spanish ? "EffectyEmailTemplateSpanish" : "EffectyEmailTemplate";
        const referenciaNumber = ticketNumber;
        const emailPayload = { fullName, referenciaNumber, email, phoneNumber, documentNumber: kyc?.documentIdNumber, convenioNumber: pin };
        await sendEmailOrMessageV3({ email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Su transacción Efecty está lista para ser recogida" : "Your Efecty Transaction is Ready for Pickup", templates: chooseEmailTemplateAndMessage(effectyEmailTemplate, false, emailPayload) });
        const bankname = "Effecty";
        const emailTemplate = language === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
        const date = moment().tz("America/Bogota").format("YYYY-MM-DD"); // should be the user timezone
        const emailTime = moment().tz("America/Bogota").format("HH:mm a");

        const emailPayloadFor = { type: language === Lenguages.Spanish ? "Solicitud de retiro" : "Withdrew request", tType: "Cashout", amount: convertToRequiredDecimalPlaces(amount, 2), localAmount: convertToRequiredDecimalPlaces(exchangeAmount, 2), date, time: emailTime, exchageRate: convertToRequiredDecimalPlaces(oneStableCoin, 2), accountNumber: phoneNumber, fullName, bankname };
        await sendEmailOrMessageV3({ email: req.user.email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Solicitud de retiro de efectivo" : "Cashout request", templates: chooseEmailTemplateAndMessage(emailTemplate, false, emailPayloadFor) });
        const responseData = { ...result.results, oneStableCoin, localAmount: exchangeAmount };
        await session.commitTransaction();
        session.endSession();
        return sendSuccessResponse(res, 200, true, translate("create_payment_success"), "kushki", responseData);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default kushkiCashoutEffecty;
