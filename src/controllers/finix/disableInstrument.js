import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import print from "../../utils/print.js";
import { ApiError } from "../../utils/ApiError.js";
import PaymentInstrument from "../../models/paymentInstrument.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import logger from "../../logger/index.js";
import finixClient from "../../config/finixClient.js";

async function DisableInstrument(req, res, next) {
    try {
        const { user, translate, query: { instrumentId } } = req;
        if (!isValidMdbId(instrumentId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "Instrument" }), true);
        if (!instrumentId) throw new ApiError("invalid Credentials", 400, translate("instrumentId_required"), true);
        const instrument = await PaymentInstrument.findOne({ _id: instrumentId });
        if (!instrument) throw new ApiError("invalid Credentials", 400, translate("instrument_not_found"), true);
        const { sourceId, disable } = instrument;
        if (disable) throw new ApiError("invalid Credentials", 400, translate("instrument_already_disable"), true);
        const body = {
            enabled: false,
        };
        let result;
        try {
            result = await finixClient.PaymentInstruments.update(sourceId, body);
        } catch (error) {
            logger.error(`Finix :: ${error.response.body._embedded.errors[0].message}`);
            throw new ApiError("Finix api error", 400, translate("something_went_wrong"), true);
        }

        if (!result) throw new ApiError("Finix api error", 400, translate("something_went_wrong"), true);
        instrument.disable = true;
        await instrument.save();
        return sendSuccessResponse(res, 200, true, translate("instrument_disable_success"), "disable instrument", result);
    } catch (error) {
        print("warn", error.message);
        next(error);
    }
}

export default DisableInstrument;
