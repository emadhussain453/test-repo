/* eslint-disable no-empty */
import ENV from "../../config/keys.js";
import logger from "../../logger/index.js";
import KushkiBankList from "../../models/kushkiBankList.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

async function CreateTokenForCashinIn(req, res, next) {
    try {
        const { translate } = req;
        const { bankId } = req.body;
        const { email } = req.user;

        const bankCode = await KushkiBankList.findOne({ code: bankId });
        if (!bankCode) {
            throw new ApiError("validation_error", 400, translate("invalid_bank"), true);
        }
        const Headers = {
            accept: "application/json",
            "content-type": "application/json",
            "public-merchant-id": ENV.KUSKHI.KUSHKI_PUBLIC_KEY,
        };

        const apiBody = {
            amount: {
                subtotalIva: 10,
                subtotalIva0: 10000,
                iva: 10,
            },
            bankId,
            currency: "COP",
            callbackUrl: "https://kushki.com",
            userType: "0",
            documentType: "CC",
            documentNumber: "8546348587",
            paymentDescription: "Test transfer token",
            email,
        };

        const result = await callApi.kushki("kushki", "createToken", "post", apiBody, false, Headers);

        if (!result.success) {
            logger.error(`kushki error :: ${result.message}`);
            throw new ApiError("Error in kushki Api", 400, translate("something_went_wrong"), true);
        }

        const finalResponse = {
            token: result.results.token,
        };
        return sendSuccessResponse(res, 200, true, translate("list_of_banks_fetch_successfuly"), "kushki", finalResponse, false);
    } catch (error) {
        next(error);
    }
    return false;
}

export default CreateTokenForCashinIn;
