import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import print from "../../utils/print.js";
import { ApiError } from "../../utils/ApiError.js";
import PaymentInstrument from "../../models/paymentInstrument.js";

async function GetInstruments(req, res, next) {
    try {
        const { user: { _id }, translate } = req;
        const instruments = await PaymentInstrument.find({ userId: _id, disable: { $ne: true } });
        if (!instruments) throw new ApiError("invalid Credentials", 400, translate("instrument_not_found"), true);
        return sendSuccessResponse(res, 200, true, translate("get_instrument"), "get instrument", instruments);
    } catch (error) {
        print("warn", error.message);
        next(error);
    }
}

export default GetInstruments;
