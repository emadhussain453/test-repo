import moment from "moment";
import crypto from "crypto-js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import { CountryCurrencies, DirectaCountryCodes, ExTypes, StableCurrencies, DirectaMinimumValues, CashOutMethods } from "../../../constants/index.js";
import callApi from "../../../utils/callApi.js";
import logger from "../../../logger/index.js";
import { ApiError } from "../../../utils/ApiError.js";
import applyCurrencyExchangeRateOnAmount from "../../../utils/exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import ENV from "../../../config/keys.js";

const createAuthHash = (apibody) => {
    const currentDate = moment().utc().format();
    const Direct24ApiKey = ENV.DIRECTA_24.API_KEY;
    const Direct24Secret = ENV.DIRECTA_24.API_SIGNATURE;
    const stringifyApiBody = JSON.stringify(apibody);

    const data = `${currentDate}${Direct24ApiKey}${stringifyApiBody}`;
    const hash = crypto.HmacSHA256(data, Direct24Secret).toString();
    const authorization = (`D24 ${hash}`);
    return {
        "X-Login": Direct24ApiKey,
        "X-Date": currentDate,
        Authorization: authorization,
    };
};

async function validation(req, res, next) {
    const { _id, email, firstName, lastName, balance, kyc } = req.user;
    try {
        const { amount, bankAccount, bankBranch, bankCode, accountType } = req.body;
        let { countryCode } = req.body;
        countryCode = countryCode.toUpperCase();
        const bank = CashOutMethods[countryCode][bankCode];
        if (!Object.keys(DirectaCountryCodes).includes(countryCode.toUpperCase())) {
            throw new ApiError("Validation Error", 400, `Only [${Object.keys(DirectaCountryCodes)}] country codes are allowed.`, true);
        }
        if (bank === undefined) throw new ApiError("Invalid bank", 400, "Invalid bank name", true);
        if (balance < amount) throw new ApiError("Invalid amount", 400, "Incificent balance", true);
        const exchangeAmount = await applyCurrencyExchangeRateOnAmount(amount, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Selling);
        const minimumAmount = DirectaMinimumValues.COP.CASHOUT;
        if (exchangeAmount < minimumAmount) throw new ApiError("Invalid Amount", 400, `minimum value you can cashout is ${minimumAmount} PSO or 0.1 USD`, true);
        // now apply exchange rates
        const apiBody = {
            country: DirectaCountryCodes[countryCode],
            document: kyc?.documentIdNumber,
            document_type: kyc?.d24DocumentType,
            first_name: firstName,
            last_name: lastName,
            amount: exchangeAmount,
            currency: CountryCurrencies[countryCode],
            bank_account: {
                account: bankAccount,
                bank_code: bank,
                branch: bankBranch,
                account_type: accountType,
            },
        };
        const authHeaders = createAuthHash(apiBody);
        const result = await callApi.callDirecta24Api("validateBaseURL", "validation", "POST", apiBody, false, authHeaders);
        if (!result.success) throw new ApiError("Error in directa Api", 400, result.message, true);

        return sendSuccessResponse(res, 200, true, "Validation successfull.", "Bank validation", false);
    } catch (error) {
        logger.error(`${email}: Bank validation error: ${error.message}`);
        next(error);
    }
    return false;
}
export default validation;
