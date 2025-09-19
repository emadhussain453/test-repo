import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import print from "../../utils/print.js";
import ENV from "../../config/keys.js";
import { ApiError } from "../../utils/ApiError.js";
import PaymentInstrument from "../../models/paymentInstrument.js";
import logger from "../../logger/index.js";
import finixClient from "../../config/finixClient.js";

async function CreateInstrument(req, res, next) {
    try {
        const { user, translate, body: { token, fraudSessionId } } = req;
        const { _id } = user;
        const data = {
            token,
            identity: ENV.FINIX.IDENTITY,
            type: "TOKEN",
        };
        let result = null;
        try {
            result = await finixClient.PaymentInstruments.create(data);
        } catch (error) {
            logger.error(`Finix :: ${error.response.body._embedded.errors[0].message}`);
            throw new ApiError("Finix api error", 400, translate("something_went_wrong"), true);
        }

        if (!result) throw new ApiError("Finix api error", 400, translate("something_went_wrong"), true);
        const { id: sourceId, cardName, bin, lastFour, expirationMonth, expirationYear, brand, cardType, name, address, instrumentType, type, currency } = result;
        const instrument = await PaymentInstrument.findOne({ userId: _id, lastFour, expirationMonth, expirationYear, disable: { $ne: true } });
        if (instrument) {
            return sendSuccessResponse(res, 200, true, translate("instrument_create_success"), "create_instrument", instrument);
        }

        const instrumentData = {
            userId: _id,
            sourceId,
            bin,
            cardName,
            expirationMonth,
            expirationYear,
            brand,
            cardType,
            name,
            fraudSessionId,
            address,
            instrumentType,
            type,
            currency,
            lastFour,
        };
        const paymentInstrument = new PaymentInstrument(instrumentData);
        const response = await paymentInstrument.save();
        return sendSuccessResponse(res, 200, true, translate("instrument_create_success"), "create_instrument", response);
    } catch (error) {
        print("warn", error.message);
        next(error);
    }
}

export default CreateInstrument;
