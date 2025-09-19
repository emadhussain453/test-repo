import moment from "moment-timezone";
import mongoose from "mongoose";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import generateUniqueId from "../../../utils/generateUniqueId.js";
import ENV from "../../../config/keys.js";
import { CountryCurrencies, DirectaCountryCodes, ExTypes, StableCurrencies, Status, Lenguages, StableActiveCountryCodes, CashoutCategories, NotificationPriority, StableModelsNames, TransactionTypes } from "../../../constants/index.js";
import headerForCashOut from "../../../utils/directa24/headerForCashOut.js";
import TransactionsCashOut from "../../../models/directaCashout.js";
import callApi from "../../../utils/callApi.js";
import logger from "../../../logger/index.js";
import { ApiError } from "../../../utils/ApiError.js";
import applyCurrencyExchangeRateOnAmount from "../../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import Users from "../../../models/users.js";
import ExchangeRates from "../../../models/exchangeRates.js";
import notificationsQueue from "../../../queues/notificationQueue.js";
import activeNotificationTokenOfUser from "../../../utils/Notifications/activeNotificationTokenOfUser.js";
import chooseEmailTemplateAndMessage from "../../../utils/chooseTemplateAndMessage.js";
import capitalizeName from "../../../utils/capitalizeName.js";
import calculateOneStableCoin from "../../../utils/calculateOneStableCoin.js";
import getFeeAndFeeObject from "../../../utils/exchangeRates/getFeeAndObject.js";
import convertToRequiredDecimalPlaces from "../../../utils/convertToRequiredDecimalPlaces.js";
import { CASHOUT_GENERIC_BANK_VALIDATION_REGEX } from "../../../constants/regex.js";
import D24Banks from "../../../models/d24Banks.js";
import sendEmailOrMessageV3 from "../../../utils/sendEmailOrMessageV3.js";
import Transactions from "../../../models/transactions.js";
import UserBalance from "../../../models/userBalance.js";
import updateBalance from "../../../utils/balanceUpdate.js";
import getAppConfig from "../../../utils/getAppConfig.js";

async function sendPushNotification(devices, title, message) {
    const sendersActiveNotificationTokens = activeNotificationTokenOfUser(devices);

    await notificationsQueue.add("pushNotification", {
        title,
        message,
        tokens: sendersActiveNotificationTokens,
    }, { priority: NotificationPriority.TWO });
}

async function cashout(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };
    const { _id, email, firstName, userName: name, lastName, balance, kyc, devices, language: userLanguage, country, phoneNumber, userBalance } = req.user;
    try {
        const { translate, userIpAddress } = req;
        const bankTemporarilyNotAvailable = ["SU_RED"];
        let { bankAccount = "", amount } = req.body;
        const { bankName, address, category, accountType = "S" } = req.body;
        const countryCode = kyc?.countryCode;

        if (bankTemporarilyNotAvailable.includes(bankName.toUpperCase())) {
            throw new ApiError("validation_error", 400, translate("service_unavailable_temporarily"), true);
        }

        // country must be colombia or mexico to use cashout
        if (countryCode !== StableActiveCountryCodes.COL && countryCode !== StableActiveCountryCodes.MEX) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        // allow user with country colombia to cashout
        if (!Object.keys(DirectaCountryCodes).includes(countryCode)) {
            const allowedCountryCodes = `[${Object.keys(DirectaCountryCodes)}]`;
            throw new ApiError("validation_error", 400, translate("allowed_country_codes", { codes: allowedCountryCodes }), true);
        }

        // select a valida bankName
        const bankMethod = await D24Banks.findOne({ countryCode, feature: "cashout", bankName: bankName.toUpperCase(), category, isActive: true });
        if (!bankMethod) throw new ApiError("Invalid details", 400, "Please select a valid bank name", true);
        const { bankCode } = bankMethod;
        // bank validations
        if (category === CashoutCategories.BANK) {
            if (!bankAccount) {
                throw new ApiError("requiredFields", 400, "bank account is required", true);
            }
            if (!accountType) {
                throw new ApiError("requiredFields", 400, "account type is required", true);
            }
            if (!CASHOUT_GENERIC_BANK_VALIDATION_REGEX.test(bankAccount)) {
                throw new ApiError("requiredFields", 400, translate("bank_account_num_must_be_valid"), true);
            }
        }
        if (category === CashoutCategories.CASH) {
            bankAccount = "";
        }
        if (category === CashoutCategories.WALLET) {
            if (["NEQUI", "DAVIPLATA"].includes(bankName)) {
                bankAccount = phoneNumber.replace("+57", "");
            }
            if (!["NEQUI", "DAVIPLATA"].includes(bankName) && !bankAccount) {
                throw new ApiError("requiredFields", 400, "bank account is required", true);
            }
            if (!["NEQUI", "DAVIPLATA"].includes(bankName) && bankAccount) {
                if (!CASHOUT_GENERIC_BANK_VALIDATION_REGEX.test(bankAccount)) {
                    throw new ApiError("requiredFields", 400, translate("wallet_account_num_must_be_valid"), true);
                }
            }
        }

        amount = convertToRequiredDecimalPlaces(amount, 4);

        if (!Object.keys(DirectaCountryCodes).includes(countryCode)) {
            throw new ApiError("Validation Error", 400, `Only [${Object.keys(DirectaCountryCodes)}] country codes are allowed.`, true);
        }

        if (userBalance.balance <= 0) throw new ApiError("Invalid amount", 400, translate("insufficient_balance"), true);
        if (userBalance.balance < amount) throw new ApiError("Invalid amount", 400, translate("insufficient_balance"), true);

        const feeObject = await getFeeAndFeeObject(amount, "DIRECTA24", "CASHOUT", countryCode);
        const finalAmountAfterFeeInSUSD = Number(amount) - feeObject.amount;
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, false, 4);
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        if (amount < app.cashout.minLimit) throw new ApiError("Invalid Amount", 400, translate("cashout_minimum_amount", { minimumAmount: app.cashout.minLimit }), true);
        if (amount > app.cashout.maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashout_maximum_amount", { amount: app.cashout.maxLimit }), true);
        // now apply exchange rates
        const invoiceId = generateUniqueId("cashout");
        const exchageRates = await ExchangeRates.findOne({ currency: CountryCurrencies[countryCode] });
        if (!exchageRates) {
            throw new ApiError("invalid request", 400, "Exchage rate not available for this currency", true);
        }

        const apiBody = {
            login: ENV.DIRECTA_24.API_KEY,
            pass: ENV.DIRECTA_24.API_PASS,
            external_id: invoiceId,
            country: DirectaCountryCodes[countryCode],
            currency: CountryCurrencies[countryCode],
            amount: exchangeAmount,
            email,
            document_type: kyc?.d24DocumentType,
            document_id: kyc?.documentIdNumber,
            beneficiary_name: firstName,
            beneficiary_lastname: lastName,
            address: "",
            phone: phoneNumber,
            bank_account: bankAccount,
            bank_code: bankCode,
            account_type: accountType,
        };
        const authHeaders = headerForCashOut(apiBody);

        const result = await callApi.callDirecta24Api("directa24CashOut", "cashOut", "POST", apiBody, false, authHeaders);
        if (!result.success) {
            logger.error(`D24 :: ${result.message}`);
            throw new ApiError("Error in directa Api", 400, translate("something_went_wrong"), true);
        }

        const { cashout_id: cashoutId } = result.results;
        // now save the invoice in db.
        const updatedBalance = userBalance.balance - amount;
        const oneStableCoin = calculateOneStableCoin(exchangeAmount, amount);
        const time = moment().utc();
        const statusHistory = [{
            status: Status.PENDING,
            time,
        }];
        const transacciondata = {
            userId: _id,
            amount, // must be a string
            localAmount: exchangeAmount,
            currency: CountryCurrencies[countryCode],
            invoiceId,
            cashoutId,
            status: Status.PENDING,
            statusHistory,
            transactionType: "debit",
            address,
            bankName,
            userIpAddress,
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
            status: Status.PENDING,
            transactionModel: StableModelsNames.CASHOUT,
            transactionType: `${TransactionTypes.Cashout}|${bankName.toUpperCase()}`,
            localAmount,
            metaData: {
                currentExchageRate: exchageRates,
                fee: {
                    amount: feeObject.amount,
                    oneStableCoin,
                    localAmount: convertToRequiredDecimalPlaces(feeObject.amount * exchageRates.selling),
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

        // now detuct the user balance
        if (!createDirectaInvoice) throw new ApiError("Invalid Details", 400, translate("error_creating_directaInvoice"), true);
        if (!globalData) throw new ApiError("Invalid Details", 400, translate("error_creating_global_transaction"), true);
        await session.commitTransaction();
        session.endSession();
        const language = req.headers["accept-language"];
        const notificationTitle = translate("cashout_title", { amount });
        const notificationMessage = translate("cashout_push_notification_message", { amount });
        await sendPushNotification(devices, notificationTitle, notificationMessage);

        const bankname = bankName.split("_").join(" ");
        const emailTemplate = (language || userLanguage) === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";
        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
        const date = moment().tz("America/Bogota").format("YYYY-MM-DD"); // should be the user timezone
        const emailTime = moment().tz("America/Bogota").format("HH:mm a");

        const emailPayload = { type: language === Lenguages.Spanish ? "Solicitud de retiro" : "Withdrew request", tType: "Cashout", amount, localAmount: exchangeAmount, date, time: emailTime, exchageRate: oneStableCoin, accountNumber: bankAccount, fullName, bankname };
        await sendEmailOrMessageV3({ email: req.user.email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Solicitud de retiro de efectivo" : "Cashout request", templates: chooseEmailTemplateAndMessage(emailTemplate, false, emailPayload) });

        return sendSuccessResponse(res, 200, true, translate("cashout_successfully"), { ...result.results, oneStableCoin }, false);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}

export default cashout;
