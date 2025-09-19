/* eslint-disable camelcase */
import moment from "moment";
import mongoose from "mongoose";
import { CountryCurrencies, ExTypes, KushkiWebhookEvents, Lenguages, Stable, StableCurrencies, StableModelsNames, Status, TransactionTypes } from "../../constants/index.js";
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
import CashinTransactionsV1 from "../../models/transactionsCashinsV1.js";
import Transactions from "../../models/transactions.js";
import sendEmailOrMessageV3 from "../../utils/sendEmailOrMessageV3.js";
import getAppConfig from "../../utils/getAppConfig.js";

async function kushkiCashin(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  const opts = { session, new: true };
  try {
    const { translate, userIpAddress } = req;
    const { bankId, amount, description = "default description" } = req.body;
    const { _id, email, kyc, country: { countryCode }, firstName, lastName, language } = req.user;
    if (!bankId) throw new ApiError("Invalid Amount", 400, translate("bank_id_required"), true);
    if (typeof amount !== "number" || amount === null) throw new ApiError("Invalid Amount", 400, translate("amount_invalid_numeric"), true);
    const app = await getAppConfig();
    if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
    if (amount < app.cashin.minLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_minimum_amount", { amount: app.cashin.minLimit }), true);
    if (amount > app.cashin.maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_maximum_amount", { amount: app.cashin.maxLimit }), true);
    const feeObject = await getFeeAndFeeObjectV1(amount, "KUSHKI", "CASHIN", "COL");
    const { amount: feeAmount } = feeObject;
    const finalAmountAfterFeeInSUSD = Number(amount) + Number(feeAmount);
    const exchangeAmount = await applyCurrencyExchangeRateOnAmount(finalAmountAfterFeeInSUSD, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Buying, false, 4);
    const exchageRates = await getExchangeRate(CountryCurrencies[countryCode]);
    const oneStableCoin = calculateOneStableCoin(exchangeAmount, amount);
    const invoiceId = generateUniqueId("kushki");

    const tokenHeaders = {
      "public-merchant-id": ENV.KUSKHI.KUSHKI_CASHIN_PUBLIC_KEY,
    };
    let documentType = kyc?.d24DocumentType;
    if (documentType === "PASS") documentType = "PP";
    const createTokenApiBody = {
      bankId,
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

    const createTokenResult = await callApi.kushki("kushki", "createToken", "post", createTokenApiBody, false, tokenHeaders);

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
    const result = await callApi.kushki("kushki", "cashin", "post", apiBody, false, Headers);
    if (!result.success) {
      logger.error(`kushki error :: ${result.message}`);
      throw new ApiError("Error in kushki init txn api", 400, translate("something_went_wrong"), true);
    }

    const { transactionReference: id, redirectUrl: url, bankName } = result.results;
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

    const type = bankName;
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
      D24ExRate: {},
      paymentInfo: {
        bank_id: bankId,
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
      transactionType: `${TransactionTypes.Cashin}|${bankName}`,
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
export default kushkiCashin;
