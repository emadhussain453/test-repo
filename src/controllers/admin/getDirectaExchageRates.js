import { ApiError } from "../../utils/ApiError.js";
import GetD24ExchangeRate from "../../utils/exchangeRates/getD24ExchangeRate.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const GetDirectaExchangeRates = async (req, res, next) => {
    try {
        const { query: { countryCode, amount = 1 }, t: translate } = req;
        if (!countryCode) throw new ApiError("Validation error", 400, translate("country_code_required"), true);
        const d24ExRate = await GetD24ExchangeRate(countryCode, amount);
        return sendSuccessResponse(res, 200, true, translate("direct24_exchange_rate_successfull"), "d24ExRate", d24ExRate);
    } catch (error) {
        next(error);
    }
    return false;
};

export default GetDirectaExchangeRates;
