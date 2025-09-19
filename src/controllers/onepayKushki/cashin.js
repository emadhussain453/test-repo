/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
import moment from "moment";
import mongoose from "mongoose";
import { CountryCurrencies, ExTypes, KushkiWebhookEvents, Lenguages, Stable, StableActiveCountryCodes, StableCurrencies, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import applyCurrencyExchangeRateOnAmount from "../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import generateUniqueId from "../../utils/generateUniqueId.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import getFeeAndFeeObjectV1 from "../../utils/exchangeRates/getFeeAndObjectV1.js";
import logger from "../../logger/index.js";
import Transactions from "../../models/transactions.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import GetD24ExchangeRate from "../../utils/exchangeRates/getD24ExchangeRate.js";
import CashinTransactionsV1 from "../../models/transactionsCashinsV1.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import getAppConfig from "../../utils/getAppConfig.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import chooseEmailTemplateAndMessage from "../../utils/chooseTemplateAndMessage.js";
import capitalizeName from "../../utils/capitalizeName.js";
import Banks from "../../models/onepayKushkiBanksV2.js";
import ENV from "../../config/keys.js";

async function onePayKushkiCashin(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };
    const apiStartingTime = moment();
    try {
        const { _id, kyc, onepayCustomerId, firstName, lastName, language, email } = req.user;
        const { translate, body: { amount: userAmount, bankId, description = "default description" }, userIpAddress } = req;
        const amount = convertToRequiredDecimalPlaces(userAmount);
        const countryCode = kyc?.countryCode;
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
        const bank = await Banks.findOne({ _id: bankId, feature: "cashin", isActive: true });
        if (!bank) throw new ApiError("Invalid details", 400, "Please select a valid bank name", true);
        const { tag, onepayId, kushkiId, name } = bank;
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        const { cashin: { minLimit, maxLimit, serviceThreshold } } = app;
        if (amount < minLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_minimum_amount", { amount: app.cashin.minLimit }), true);
        if (amount > maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_maximum_amount", { amount: app.cashin.maxLimit }), true);
        let id; let url; let bank_id; let response;
        const service = tag === "both" ? (Number(amount) > serviceThreshold ? "ONEPAY" : "KUSHKI") : tag.toUpperCase();
        const feeObject = await getFeeAndFeeObjectV1(amount, service, "CASHIN", "COL");
        const { amount: feeAmount } = feeObject;
        const finalAmountAfterFeeInSUSD = Number(amount) + Number(feeAmount);
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Buying, false, 4);
        const exchageRates = await getExchangeRate(CountryCurrencies[countryCode]);
        const oneStableCoin = calculateOneStableCoin(exchangeAmount, amount);
        const invoiceId = generateUniqueId(service.toLowerCase());
        if (service === "ONEPAY") {
            bank_id = onepayId;
            const apiBody = {
                customer_id: onepayCustomerId,
                amount: Number(exchangeAmount),
                bank_id: onepayId,
                external_id: invoiceId,
            };
            const Headers = {
                accept: "application/json",
                "x-idempotency": invoiceId,
                "content-type": "application/json",
            };
            const onepayApiStartingTime = moment();
            const result = await callApi.onepay("onepay", "onepayChargesPse", "post", apiBody, false, Headers);
            const timeTakenbyOnepayApi = moment().diff(onepayApiStartingTime, "seconds");
            logger.info(`onepay api execution time :: ${timeTakenbyOnepayApi}`);
            if (!result.success) {
                logger.error(`onePay error :: ${result.message}`);
                throw new ApiError("Error in onePay Api", 400, translate("something_went_wrong"), true);
            }
            id = result.results.id;
            url = result.results.url;
            response = result.results;
        } else {
            bank_id = kushkiId;
            const tokenHeaders = {
                "public-merchant-id": ENV.KUSKHI.KUSHKI_CASHIN_PUBLIC_KEY,
            };
            let documentType = kyc?.d24DocumentType;
            if (documentType === "PASS") documentType = "PP";
            const createTokenApiBody = {
                bankId: kushkiId,
                amount: {
                    subtotalIva: Number(exchangeAmount),
                    subtotalIva0: 0,
                    iva: 0,
                    extraTaxes: {
                        tasaAeroportuaria: 0,
                        agenciaDeViajes: 0,
                        iac: 0,
                    },
                },
                currency: CountryCurrencies[countryCode],
                callbackUrl: "https://kushki.com",
                userType: "0",
                documentType,
                documentNumber: kyc?.documentIdNumber,
                paymentDescription: description,
                email,
            };
            const getTokenApiStartingTime = moment();
            const createTokenResult = await callApi.kushki("kushki", "createToken", "post", createTokenApiBody, false, tokenHeaders);
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
                            ENV.KUSKHI.CASHIN_WEBHOOK_URL,
                        ],
                    },
                ],
            };
            const Headers = {
                "Private-Merchant-Id": ENV.KUSKHI.KUSHKI_CASHIN_PRIVATE_KEY,
            };
            const createTxnApiStartingTime = moment();
            const result = await callApi.kushki("kushki", "cashin", "post", apiBody, false, Headers);
            const timeTakenbyKushkiCashinApi = moment().diff(createTxnApiStartingTime, "seconds");
            logger.info(`kushki txn api execution time :: ${timeTakenbyKushkiCashinApi}`);
            if (!result.success) {
                logger.error(`kushki error :: ${result.message}`);
                throw new ApiError("Error in kushki init txn api", 400, translate("something_went_wrong"), true);
            }
            const timeTakenbyKushkBothApis = moment().diff(getTokenApiStartingTime, "seconds");
            logger.info(`kushki both api execution time :: ${timeTakenbyKushkBothApis}`);
            id = result.results.transactionReference;
            url = result.results.redirectUrl;
            response = {
                ...result.results,
                url,
            };
        }
        const { amount: totalAmountFeeAmount, stableFeeDetuction, serviceFeeDetuction } = feeObject;

        const buyingExchangeRate = exchageRates.buying;
        const stableFeeDetuctionLocal = convertToRequiredDecimalPlaces(stableFeeDetuction * buyingExchangeRate);
        const serviceFeeDetuctionLocal = convertToRequiredDecimalPlaces(serviceFeeDetuction * buyingExchangeRate);
        const localAmount = convertToRequiredDecimalPlaces(totalAmountFeeAmount * buyingExchangeRate);

        const time = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
        const statusHistory = [{
            status: Status.PENDING,
            time,
        }];

        let D24ExRates = {};
        try {
            D24ExRates = await GetD24ExchangeRate(countryCode, amount);
        } catch (error) {
            logger.error("D24_Exchange_not_fetcher");
        }
        const D24ExRate = {
            fxRate: D24ExRates.fx_rate,
            currency: D24ExRates.currency,
            convertedAmount: D24ExRates.converted_amount,
        };
        const type = name;
        const invoivcedata = {
            userId: _id,
            invoiceId,
            depositId: id,
            amount,
            localAmount: exchangeAmount,
            description: Stable,
            status: Status.PENDING,
            statusHistory,
            transactionType: "credit",
            currency: CountryCurrencies[countryCode],
            type,
            currentExchangeRate: exchageRates,
            D24ExRate,
            paymentInfo: {
                bank_id,
                type,
                method: type,
                subtype: "PSE",
                methodName: type,
            },
            fee: {
                ...feeObject,
                oneStableCoin,
                stableFeeDetuctionLocal,
                serviceFeeDetuctionLocal,
                localAmount,
            },
            userIpAddress,
        };
        const newInvoice = new CashinTransactionsV1(invoivcedata);
        const { _id: tId, localAmount: amountLocal } = newInvoice;
        // save the trantion in consolidatedTrasntions
        const globalTransTable = {
            transactionRefrenceId: tId,
            userId: _id,
            amount,
            status: Status.PENDING,
            transactionModel: StableModelsNames.CASHIN_V1,
            transactionType: `${TransactionTypes.Cashin}|${name}`,
            localAmount: amountLocal,
            metaData: {
                currentExchageRate: exchageRates,
                fee: {
                    amount: feeAmount,
                    localAmount,
                    oneStableCoin,
                    serviceFee: feeObject.serviceFeeDetuction,
                    stableFee: feeObject.stableFeeDetuction,
                },
            },
        };
        // before adding create a transaction in the database
        const globalData = new Transactions(globalTransTable);

        await newInvoice.save(opts);
        await globalData.save(opts);
        const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
        const emailTemplate = language === Lenguages.Spanish ? "PSECompletionURLSpanish" : "PSECompletionURL";
        const emailMessage = translate("complete_cashin_process");

        await sendEmailOrMessageV3({ email, onEmail: true, emailSubject: language === Lenguages.Spanish ? "Recarga" : "Money added", templates: chooseEmailTemplateAndMessage(emailTemplate, false, { message: emailMessage, url, fullName }) });
        const responseData = { ...response, oneStableCoin, localAmount: exchangeAmount };
        await session.commitTransaction();
        session.endSession();
        const timeTakenbyApi = moment().diff(apiStartingTime, "seconds");
        logger.info(`overall execution time :: ${timeTakenbyApi}`);
        return sendSuccessResponse(res, 200, true, translate("create_payment_success"), "onepay", responseData);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default onePayKushkiCashin;
