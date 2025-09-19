import Payees from "../../models/payees.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const getPayees = async (req, res, next) => {
    try {
        const { user: { _id }, query: { page = 1, limit = 10, favourite } } = req;
        const query = { userId: _id };
        const { translate } = req;
        if (favourite === "true") {
            query.favourite = true;
        }
        let payees;
        const total = await Payees.countDocuments(query);
        payees = await Payees.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("payeeUserId", "avatar email phoneNumber firstName lastName")
            .sort({ favourite: -1, firstName: 1 });
        payees = payees.map((payee) => ({
            ...payee.toObject(),
            phoneNumber: payee.payeeUserId?.phoneNumber || payee.phoneNumber,
            firstName: payee.payeeUserId?.firstName || payee.firstName,
            lastName: payee.payeeUserId?.lastName || payee.lastName,
        }));
        const finalPayload = {
            payees,
            total,
        };
        return sendSuccessResponse(res, 200, true, translate("get_payees_success"), "getPayees", finalPayload);
    } catch (error) {
        next(error);
    }
    return false;
};

export default getPayees;
