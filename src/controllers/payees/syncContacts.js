import Users from "../../models/users.js";
import Payees from "../../models/payees.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { optimizedSyncContectsAggregationPipeline } from "../../pipes/syncPayeesAggregation.js";

const syncContacts = async (req, res, next) => {
    try {
        const { user: { _id }, query: { page = 1, limit = 10 }, body: { contacts } } = req;
        const { translate } = req;
        const payees = await Users.aggregate(optimizedSyncContectsAggregationPipeline(_id, contacts));

        if (payees.length <= 0) {
            return sendSuccessResponse(res, 200, true, translate("new_payees_not_exist"), "addPayees");
        }

        const newPayeesToCreate = payees[0].newPayeesToAdd;
        const createNewPayess = await Payees.insertMany(newPayeesToCreate);
        const finalPayload = {
            payees: newPayeesToCreate,
            newPayees: createNewPayess,
        };
        return sendSuccessResponse(res, 200, true, translate("get_payees_success"), "getPayees", finalPayload);
    } catch (error) {
        next(error);
    }
    return false;
};

export default syncContacts;
