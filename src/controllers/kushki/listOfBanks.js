import { ExpirySeconds } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import ENV from "../../config/keys.js";
import callApi from "../../utils/callApi.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import KushkiBankList from "../../models/kushkiBankList.js";

async function listOfBanks(req, res, next) {
    try {
        const { translate } = req;
        const Headers = {
            accept: "application/json",
            "content-type": "application/json",
            "public-merchant-id": ENV.KUSKHI.KUSHKI_PUBLIC_KEY,
        };

        const result = await callApi.kushki("kushki", "kushkiBanks", "get", null, false, Headers);
        if (!result.success) throw new ApiError("Error in kushki Api", 400, translate("kushki_api_error", { message: result.message }), true);
        const finalResponse = {
            banks: result.results,
        };
        // const banks = result.results;
        // const bankInserts = banks.map((bank) => ({
        //     code: bank.code,
        //     name: bank.name,
        // }));

        // await KushkiBankList.insertMany(bankInserts);

        return sendSuccessResponse(res, 200, true, translate("list_of_banks_fetch_successfuly"), "kushki", finalResponse, false);
    } catch (error) {
        next(error);
    }
    return false;
}
export default listOfBanks;
