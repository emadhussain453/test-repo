import Banks from "../../models/onepayKushkiBanksV2.js";
import OnepayKushkBenefeciery from "../../models/onepayKushkiCashoutBenefeciary.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import generateUniqueId from "../../utils/generateUniqueId.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const addBenefeciery = async (req, res, next) => {
    try {
        const { user: { _id, onepayCustomerId }, body: { bankId, accountNumber } } = req;
        let { body: { accountType } } = req;
        const { translate } = req;
        if (!bankId) throw new ApiError("Invalid details", 400, translate("bankId_is_required"), true);
        if (!accountType) throw new ApiError("Invalid details", 400, translate("accountType_is_required"), true);
        if (!accountNumber) throw new ApiError("Invalid details", 400, translate("accountNumber_is_required"), true);
        const bank = await Banks.findOne({ _id: bankId, feature: "cashout", isActive: true });
        if (!bank) throw new ApiError("Invalid details", 400, translate("select_valid_bank_name"), true);
        const { tag, onepayId, kushkiId } = bank;
        let kushkiAccountType;

        switch (accountType?.toUpperCase()) {
            case "SAVINGS":
                kushkiAccountType = "CA";
                break;
            case "CHECKING":
                kushkiAccountType = "CC";
                break;
            case "ELECTRONIC_DEPOSIT":
                kushkiAccountType = "DE";
                break;
            case "TRANSFIYA":
                kushkiAccountType = "NC";
                accountType = "checking";
                break;
            default:
                throw new Error(`Unsupported account type: ${accountType}`);
        }
        const checkBeneficiary = await OnepayKushkBenefeciery.findOne({ userId: _id, accountNumber, bankId, kushkiAccountType, isDeleted: false });
        if (checkBeneficiary) throw new ApiError("Invalid details", 400, translate("cashout_beneficiary_already_exist"), true);
        let onepayAccountId;
        if (tag !== "kushki" && kushkiAccountType?.toUpperCase() !== "NC") {
            if (!onepayCustomerId) throw new ApiError("Invalid details", 400, translate("customer_not_found"), true);
            const invoiceId = generateUniqueId("onepay");
            const Headers = {
                accept: "application/json",
                "x-idempotency": invoiceId,
                "content-type": "application/json",
            };
            const apiBody = {
                subtype: accountType,
                authorization: false,
                "re-enrollment": false,
                account_number: accountNumber,
                external_id: _id,
                customer_id: onepayCustomerId,
                bank_id: onepayId,
            };
            const result = await callApi.onepay("onepay", "createAccount", "post", apiBody, false, Headers);
            if (!result.success) throw new ApiError("Error in onePay Api", 400, translate("onepay_api_error", { message: result.message }), true);
            onepayAccountId = result.results.id;
        }

        const benefeciaryData = new OnepayKushkBenefeciery({
            userId: _id,
            onepayAccountId,
            kushkiId,
            bankId,
            accountNumber,
            accountType,
            kushkiAccountType,
        });
        const newBeneficiary = await benefeciaryData.save();
        return sendSuccessResponse(res, 200, true, translate("create_payee_success"), "addBenefeciery", newBeneficiary);
    } catch (error) {
        next(error);
    }
    return false;
};

export default addBenefeciery;
