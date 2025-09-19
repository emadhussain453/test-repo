import { ExpirySeconds } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import getFromCache from "../../utils/cache/getFromCache.js";
import setToCache from "../../utils/cache/setToCache.js";
import callApi from "../../utils/callApi.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

function addAvailability(banks) {
    return banks.map((bank) => ({
        ...bank,
        available: true,
    }));
}
async function listOfBanks(req, res, next) {
    try {
        const { translate } = req;
        const Headers = {
            accept: "application/json",
            "content-type": "application/json",
        };
        const key = `onepay-banks`;
        // lookup in cache
        const banksFromCache = await getFromCache(key);
        if (banksFromCache) return sendSuccessResponse(res, 200, true, translate("list_of_banks_fetch_successfuly"), "onepay", banksFromCache);
        const result = await callApi.onepay("onepay", "banks", "get", null, false, Headers);
        if (!result.success) throw new ApiError("Error in onePay Api", 400, translate("directa_api_error", { message: result.message }), true);
        const finalResponse = {
            banks: addAvailability(result.results?.data || result.results || []),
        };
        await setToCache(key, finalResponse, ExpirySeconds.d1);
        return sendSuccessResponse(res, 200, true, translate("list_of_banks_fetch_successfuly"), "onepay", finalResponse, false);
    } catch (error) {
        next(error);
    }
    return false;
}
export default listOfBanks;
