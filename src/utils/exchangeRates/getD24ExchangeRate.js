import KEYS from "../../config/keys.js";
import callApi from "../callApi.js";
import { DirectaCountryCodes } from "../../constants/index.js";
import { ApiError } from "../ApiError.js";

const GetD24ExchangeRate = async (countryCode, amount = 1) => {
    try {
        const directaCountryCode = DirectaCountryCodes[countryCode];
        const params = `?country=${directaCountryCode}&amount=${amount}`;
        const headers = {
            Authorization: `Bearer ${KEYS.DIRECTA_24.READ_ONLY_API_KEY}`,
        };

        const exRate = await callApi.callDirecta24Api("directa24BaseURL", "getExchageRate", "GET", false, params, headers);
        if (!exRate.success) {
            throw new Error(exRate.message);
        }
        return exRate.results;
    } catch (error) {
        throw new ApiError("directa24", 400, error.message, false);
    }
};

export default GetD24ExchangeRate;
