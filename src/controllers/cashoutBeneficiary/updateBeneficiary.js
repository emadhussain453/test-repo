import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import CashoutBeneficiary from "../../models/cashoutBeneficiary.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import deleteFromCache from "../../utils/cache/deleteFromCache.js";

const fieldNames = ["address", "accountType", "bankAccount"];

const UpdateCashoutBeneficiary = async (req, res, next) => {
    try {
        const { user: { _id, country: { countryCode } }, body: { beneficiaryId, accountType, address, bankAccount } } = req;
        const { translate } = req;
        if (!isValidMdbId(beneficiaryId)) throw new ApiError("Invalid Credentials", 400, translate("invalid_md_id", { name: "beneFiciaryId" }), true);
        const cashoutDetails = await CashoutBeneficiary.findOne({ _id: beneficiaryId, userId: _id });
        if (!cashoutDetails) throw new ApiError("No Data", 400, translate("no_beneficiary_found"), true);
        const query = {
            _id: beneficiaryId,
            userId: _id,
        };
        const updateQuery = {};
        if (accountType) updateQuery.accountType = accountType;
        if (address) updateQuery.address = address;
        if (bankAccount) {
            const checkIfBeneFiciaryExist = await CashoutBeneficiary.findOne({ userId: _id, bankAccount, bankName: cashoutDetails.bankName, countryCode, id: { $ne: beneficiaryId } }).lean();
            if (checkIfBeneFiciaryExist) throw new ApiError("user_error", 400, translate("cashout_beneficiary_already_exist"), true);
            updateQuery.bankAccount = bankAccount;
        }
        const updatedBeneficiary = await CashoutBeneficiary.findOneAndUpdate(query, { $set: updateQuery }, { new: true });
        const key = `cashout-beneficiary:${_id}:${cashoutDetails.category}`;
        const allDatakey = `cashout-beneficiary:${_id}:`;
        await deleteFromCache([key, allDatakey]);
        return sendSuccessResponse(res, 200, true, translate("get_payees_success"), "getPayee", updatedBeneficiary);
    } catch (error) {
        next(error);
    }
    return false;
};

export default UpdateCashoutBeneficiary;
