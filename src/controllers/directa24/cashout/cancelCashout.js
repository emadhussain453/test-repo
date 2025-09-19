import mongoose from "mongoose";
import { ApiError } from "../../../utils/ApiError.js";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import ENV from "../../../config/keys.js";
import headerForCashOut from "../../../utils/directa24/headerForCashOut.js";
import callApi from "../../../utils/callApi.js";
import TransactionsCashOut from "../../../models/directaCashout.js";
import logger from "../../../logger/index.js";
import { Status } from "../../../constants/index.js";

async function cancelCashout(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };
    try {
        const { email } = req.user;
        const { cashoutId } = req.body;
        const { translate } = req;
        const { _id } = req.user;
        const checkIfCashoutExist = await TransactionsCashOut.findOne({ userId: _id, cashoutId }, null, opts);
        if (!checkIfCashoutExist) throw new ApiError("Invalid Credentials", 400, translate("no_cashoutId_exist"), true);
        const { invoiceId, status } = checkIfCashoutExist;

        const apiBody = {
            login: ENV.DIRECTA_24.API_KEY,
            pass: ENV.DIRECTA_24.API_PASS,
            cashout_id: cashoutId,
        };
        const authHeaders = headerForCashOut(apiBody);
        const result = await callApi.callDirecta24Api("directa24CashOut", "cancelCashOut", "DELETE", apiBody, false, authHeaders);
        if (!result.success) {
            logger.error(`D24 :: ${result.message}`);
            throw new ApiError("Error in directa Api", 400, translate("something_went_wrong"), true);
        }
        const updateCashout = TransactionsCashOut.updateOne({ invoiceId }, { status: Status.CANCELLED }, opts);

        await session.commitTransaction();
        session.endSession();

        return sendSuccessResponse(res, 200, true, translate("cashout_successfully"), result.results, false);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default cancelCashout;
