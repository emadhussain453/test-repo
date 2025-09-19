/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
import moment from "moment";
import mongoose from "mongoose";
import { CountryCurrencies, ExTypes, KushkiWebhookEvents, Lenguages, NotificationPriority, NotificationTypes, StableActiveCountryCodes, StableCurrencies, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import applyCurrencyExchangeRateOnAmount from "../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import generateUniqueId from "../../utils/generateUniqueId.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import getFeeAndFeeObjectV1 from "../../utils/exchangeRates/getFeeAndObjectV1.js";
import logger from "../../logger/index.js";
import Transactions from "../../models/transactions.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import getAppConfig from "../../utils/getAppConfig.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import capitalizeName from "../../utils/capitalizeName.js";
import Banks from "../../models/onepayKushkiBanksV2.js";
import ENV from "../../config/keys.js";
import checkMoneyOutAndSoftBlockUser from "../../utils/fraudDetection/checkMoneyOutAndSoftBlockUser.js";
import TransactionsCashOut from "../../models/directaCashout.js";
import updateBalance from "../../utils/balanceUpdate.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import notificationsQueue from "../../queues/notificationQueue.js";

async function sendPushNotification(devices, title, message, additionalDetails) {
    const sendersActiveNotificationTokens = activeNotificationTokenOfUser(devices);

    await notificationsQueue.add("pushNotification", {
        title,
        message,
        tokens: sendersActiveNotificationTokens,
        additionalDetails,
    }, { priority: NotificationPriority.TWO });
}
async function onePayKushkiCashout(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };
    const apiStartingTime = moment();
    try {
        const { _id, kyc, phoneNumber, fraudDetection, isUserHaveToUploadBankStatement, isBankStatementUploaded, userBalance, onepayCustomerId, devices, firstName, lastName, bankStatementVerification } = req.user;
        const { translate, body: { amount: userAmount, bankId, account_id, accountType, type: bankType, accountNumber, title = "default title", description = "default description" }, userIpAddress } = req;
        const amount = convertToRequiredDecimalPlaces(userAmount);
        const countryCode = kyc?.countryCode;
        if (fraudDetection?.softBlock) throw new ApiError("Invalid Details", 400, translate("soft_block"), true);
        if (!onepayCustomerId) throw new ApiError("validation_error", 400, translate("customer_not_found"), true);

        if (countryCode !== StableActiveCountryCodes.COL) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        if (!kyc?.documentType || !kyc?.documentIdNumber) {
            throw new ApiError("validation_error", 400, translate("missing_document_details"), true);
        }
        if (typeof amount !== "number" || amount === null || amount < 0) throw new ApiError("Invalid Amount", 400, translate("amount_invalid_numeric"), true);
        if (!onepayCustomerId) throw new ApiError("Invalid Amount", 400, translate("create_customer_first"), true);
        if (!bankId) throw new ApiError("Invalid Amount", 400, translate("bank_id_required"), true);
        // select a valida bankName
        const bank = await Banks.findOne({ _id: bankId, feature: "cashout", isActive: true });
        if (!bank) throw new ApiError("Invalid details", 400, "Please select a valid bank name", true);
        const { tag, onepayId, kushkiId, name } = bank;
        if (userBalance.balance < amount) throw new ApiError("Invalid amount", 400, translate("insufficient_balance"), true);
        if (!bankStatementVerification && isBankStatementUploaded) throw new ApiError("Invalid Credentials", 400, translate("documents_approval_pending"), true);
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        const { cashout: { minLimit, maxLimit, serviceThreshold }, fraudDetection: { durationMinutes, percentageThreshold, highCashinAmountToCheck } } = app;
        if (!bankStatementVerification && isUserHaveToUploadBankStatement) throw new ApiError("Invalid Details", 400, translate("document_verification_required", { type: "cash-out" }), true);
        if (amount < minLimit) throw new ApiError("Invalid Amount", 400, translate("cashout_minimum_amount", { minimumAmount: app.cashout.minLimit }), true);
        if (amount > maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashout_maximum_amount", { amount: app.cashout.maxLimit }), true);
        const checkIfUserBlocked = await checkMoneyOutAndSoftBlockUser(_id, amount, durationMinutes, percentageThreshold, highCashinAmountToCheck, "cash-out");
        if (checkIfUserBlocked) throw new ApiError("invalid details", 400, translate("soft_block"), true);
        let id; let bank_id; let response;
        const service = bankType?.toUpperCase() === "TRANSFIYA" ? "KUSHKI" : (tag === "both" ? (Number(amount) > serviceThreshold ? "ONEPAY" : "KUSHKI") : tag.toUpperCase());
        const feeObject = await getFeeAndFeeObjectV1(amount, service, "CASHOUT", countryCode);
        const { amount: feeAmount } = feeObject;
        const finalAmountAfterFeeInSUSD = Number(amount) - Number(feeAmount);
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, false, 0);
        const exchageRates = await getExchangeRate(CountryCurrencies[countryCode]);
        const oneStableCoin = calculateOneStableCoin(exchangeAmount, amount);
        const invoiceId = generateUniqueId(service.toLowerCase());
        if (service === "ONEPAY") {
            if (!account_id) throw new ApiError("Invalid Amount", 400, translate("account_id_required"), true);
            bank_id = onepayId;
            const apiBody = {
                title,
                customer_id: onepayCustomerId,
                amount: Number(exchangeAmount),
                account_id,
                currency: CountryCurrencies[countryCode],
                method: "TURBO",
            };
            const Headers = {
                accept: "application/json",
                "x-idempotency": invoiceId,
                "content-type": "application/json",
            };
            const onepayApiStartingTime = moment();
            const result = await callApi.onepay("onepay", "onepayCashout", "post", apiBody, false, Headers);
            const timeTakenbyOnepayApi = moment().diff(onepayApiStartingTime, "seconds");
            logger.info(`onepay api execution time :: ${timeTakenbyOnepayApi}`);
            if (!result.success) {
                logger.error(`onePay cashout error :: ${result.message}`);
                throw new ApiError("Error in onePay Api", 400, translate("something_went_wrong"), true);
            }
            id = result.results.id;
            response = result.results;
        } else {
            if (!accountType) throw new ApiError("Invalid Amount", 400, translate("account_type_required"), true);
            bank_id = kushkiId;
            const tokenHeaders = {
                "public-merchant-id": ENV.KUSKHI.KUSHKI_PUBLIC_KEY,
            };
            let documentType = kyc?.d24DocumentType;
            if (documentType === "PASS") documentType = "PP";
            const createTokenApiBody = {
                documentType,
                documentNumber: kyc?.documentIdNumber,
                accountType,
                accountNumber: accountNumber || phoneNumber,
                bankId: kushkiId,
                totalAmount: Number(exchangeAmount),
                currency: CountryCurrencies[countryCode],
                paymentDescription: description,
                name: `${firstName} ${lastName}`,
            };
            const getTokenApiStartingTime = moment();
            const createTokenResult = await callApi.kushki("kushki", "payoutToken", "post", createTokenApiBody, false, tokenHeaders);
            const timeTakenbyGetTokenApi = moment().diff(getTokenApiStartingTime, "seconds");
            logger.info(`kushki token api execution time :: ${timeTakenbyGetTokenApi}`);
            if (!createTokenResult.success) {
                logger.error(`kushki error :: ${createTokenResult.message}`);
                throw new ApiError("Error in kushki token api", 400, translate("something_went_wrong"), true);
            }
            const apiBody = {
                token: createTokenResult.results.token,
                amount: {
                    subtotalIva: 0,
                    subtotalIva0: Number(exchangeAmount),
                    iva: 0,
                },
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
            const createTxnApiStartingTime = moment();
            const result = await callApi.kushki("kushki", "cashout", "post", apiBody, false, Headers);
            const timeTakenbyKushkiCashinApi = moment().diff(createTxnApiStartingTime, "seconds");
            logger.info(`kushki txn api execution time :: ${timeTakenbyKushkiCashinApi}`);
            if (!result.success) {
                logger.error(`kushki error :: ${result.message}`);
                throw new ApiError("Error in kushki init txn api", 400, translate("something_went_wrong"), true);
            }
            id = result.results.transactionReference;
            response = {
                ...result.results,
            };
        }
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
            type: service,
            bankName: name,
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
            transactionType: `${TransactionTypes.Cashout}|${name}`,
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
        const responseData = { ...response, oneStableCoin, localAmount: exchangeAmount };
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

        const bankname = name;
        const emailTemplate = language === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
        const date = moment().tz("America/Bogota").format("YYYY-MM-DD"); // should be the user timezone
        const emailTime = moment().tz("America/Bogota").format("HH:mm a");

        const emailPayload = { type: language === Lenguages.Spanish ? "Solicitud de retiro" : "Withdrew request", tType: "Cashout", amount: convertToRequiredDecimalPlaces(amount, 2), localAmount: convertToRequiredDecimalPlaces(exchangeAmount, 2), date, time: emailTime, exchageRate: convertToRequiredDecimalPlaces(oneStableCoin, 2), accountNumber, fullName, bankname };
        await sendEmailOrMessageV3({ email: req.user.email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Solicitud de retiro de efectivo" : "Cashout request", templates: chooseEmailTemplateAndMessage(emailTemplate, false, emailPayload) });
        const timeTakenbyApi = moment().diff(apiStartingTime, "seconds");
        logger.info(`overall execution time :: ${timeTakenbyApi}`);
        return sendSuccessResponse(res, 200, true, translate("invoice_created_success"), "onepay", responseData);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default onePayKushkiCashout;
