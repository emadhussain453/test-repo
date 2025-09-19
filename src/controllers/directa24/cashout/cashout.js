import moment from "moment";
import mongoose from "mongoose";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import generateUniqueId from "../../../utils/generateUniqueId.js";
import ENV from "../../../config/keys.js";
import { CountryCurrencies, DirectaCountryCodes, ExTypes, StableCurrencies, Status, DirectaMinimumValues, CashOutMethods, Lenguages, AmountCalculationType, StableActiveCountryCodes, CashoutCategories, NotificationPriority } from "../../../constants/index.js";
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
import sendEmailOrMessageV3 from "../../../utils/sendEmailOrMessageV3.js";
import UserBalance from "../../../models/userBalance.js";
import updateBalance from "../../../utils/balanceUpdate.js";

async function sendPushNotification(devices, title, message, additionalDetails) {
    const sendersActiveNotificationTokens = activeNotificationTokenOfUser(devices);

    await notificationsQueue.add("pushNotification", {
        title,
        message,
        tokens: sendersActiveNotificationTokens,
        additionalDetails,
    }, { priority: NotificationPriority.TWO });
}

async function cashout(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };
    const { _id, email, firstName, userName: name, lastName, balance, kyc, devices, language: userLanguage, country, phoneNumber, notificationCount, userBalance } = req.user;
    try {
        const { translate, userIpAddress } = req;

        const bankTemporarilyNotAvailable = ["EFECTY", "SU_RED"];
        const bankAccountsNotRequired = ["EFECTY", "SU_RED"];
        let { bankAccount = "", amount } = req.body;
        const { bankName, accountType, address, category } = req.body;

        if (bankTemporarilyNotAvailable.includes(bankName.toUpperCase())) {
            throw new ApiError("validation_error", 400, translate("service_unavailable_temporarily"), true);
        }

        amount = convertToRequiredDecimalPlaces(amount, 4);
        const { countryCode } = country;

        if (countryCode !== StableActiveCountryCodes.COL || kyc?.countryCode !== StableActiveCountryCodes.COL) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        const bankCode = CashOutMethods[countryCode][bankName];
        if (!bankCode) throw new ApiError("Invalid details", 400, "Please select a valid bank name", true);
        if (!Object.keys(DirectaCountryCodes).includes(countryCode)) {
            const allowedCountryCodes = `[${Object.keys(DirectaCountryCodes)}]`;
            throw new ApiError("validation_error", 400, translate("allowed_country_codes", { codes: allowedCountryCodes }), true);
        }

        const isBankAccountRequired = bankAccountsNotRequired.includes(bankName);

        if (!isBankAccountRequired && !bankAccount) {
            throw new ApiError("Invalid details", 400, "Bank account is required.", true);
        }
        if (isBankAccountRequired) {
            bankAccount = "";
        }

        if (!Object.keys(DirectaCountryCodes).includes(countryCode)) {
            throw new ApiError("Validation Error", 400, `Only [${Object.keys(DirectaCountryCodes)}] country codes are allowed.`, true);
        }

        if (userBalance.balance <= 0) throw new ApiError("Invalid amount", 400, translate("insufficient_balance"), true);
        if (userBalance.balance < amount) throw new ApiError("Invalid amount", 400, translate("insufficient_balance"), true);

        const feeObject = await getFeeAndFeeObject(amount, "DIRECTA24", "CASHOUT", "COL");
        const finalAmountAfterFeeInSUSD = Number(amount) - feeObject.amount;
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling, false, 4);
        const minimumAmount = DirectaMinimumValues.COP.CASHOUT;

        if (exchangeAmount < minimumAmount) throw new ApiError("Invalid Amount", 400, translate("cashout_minimum_amount", { minimumAmount }), true);
        // now apply exchange rates
        const invoiceId = generateUniqueId("cashout");
        const exchageRates = await ExchangeRates.findOne({ currency: CountryCurrencies[countryCode] });
        if (!exchageRates) {
            throw new ApiError("invalid request", 400, "Exchage rate not available for this currency", true);
        }
        if (category === CashoutCategories.WALLET) bankAccount = phoneNumber.replace("+57", "");
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
            address,
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
            userLastBalance: userBalance.balance,
            userUpdatedBalance: updatedBalance,
            currentExchageRate: exchageRates,
            userIpAddress,
            fee: {
                ...feeObject,
                oneStableCoin,
            },
        };

        if (!isBankAccountRequired) {
            transacciondata.to = bankAccount;
        }

        const createDirectaInvoice = new TransactionsCashOut(transacciondata);
        await createDirectaInvoice.save(opts);

        const extraPayload = {
            opts,
            translate,
        };
        const balanceUpdateToUser = userBalance.userId;
        await updateBalance(balanceUpdateToUser, -amount, extraPayload);

        // now detuct the user balance
        if (!createDirectaInvoice) throw new ApiError("Invalid Details", 400, translate("error_creating_directaInvoice"), true);

        await session.commitTransaction();
        session.endSession();
        const language = req.headers["accept-language"];
        const notificationTitle = translate("cashout_title", { amount });
        const notificationMessage = translate("cashout_push_notification_message", { amount });
        await sendPushNotification(devices, notificationTitle, notificationMessage);

        const bankname = bankName.split("_").join(" ");
        const emailTemplate = (language || userLanguage) === Lenguages.Spanish ? "MovementTemplateSpanish" : "MovementTemplate";

        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
        const emailPayload = { type: language === Lenguages.Spanish ? "Solicitud de retiro" : "Withdrew request", tType: "Cashout", amount, localAmount: exchangeAmount, date: moment().format("ddd MM YYYY"), time: moment().format("HH:mm a"), exchageRate: exchageRates.selling, accountNumber: bankAccount, fullName, bankname };
        await sendEmailOrMessageV3({ email: req.user.email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Solicitud de retiro de efectivo" : "Cashout request", templates: chooseEmailTemplateAndMessage(emailTemplate, false, emailPayload) });

        return sendSuccessResponse(res, 200, true, translate("cashout_successfully"), result.results, false);
    } catch (error) {
        logger.error(`${email}: Cashout transaction error: ${error.message}`);
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}

export default cashout;
