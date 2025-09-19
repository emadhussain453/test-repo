import moment from "moment";
import { StableServicesFeatures, Status } from "../../constants/index.js";
import DirectaCashout from "../../models/directaCashout.js";
import returnResponse from "./returnResponsed24Webhook.js";
import Transactions from "../../models/transactions.js";

const markCashoutDepositAsFailled = async ({ cashoutId, message, depositStatus = Status.FAILED, statusCode = 400, opts = {}, reimbursed = false }) => {
    try {
        if (cashoutId) {
            const status = depositStatus;
            const failedMessage = message;
            const time = moment().add(1, "day").utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
            const statusHistory = {
                status,
                time,
            };
            const updateQuery = {
                $set: { status },
                $push: { statusHistory },
            };

            if (depositStatus === Status.FAILED) {
                updateQuery.$set.failedMessage = failedMessage;
            }
            if (reimbursed) {
                updateQuery.$set.reimbursed = true;
            }
            const transactionToUpdate = await DirectaCashout.findOneAndUpdate({ cashoutId }, updateQuery, opts);
            await Transactions.updateOne({ transactionRefrenceId: transactionToUpdate._id }, { $set: { status } }, opts);
        }
        return returnResponse(statusCode, message, StableServicesFeatures.DIRECTA24.CASHOUT);
    } catch (error) {
        throw new Error(error.message);
    }
};
export default markCashoutDepositAsFailled;
