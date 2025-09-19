import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import D24Banks from "../../models/d24Banks.js";
import CashoutBeneficiary from "../../models/cashoutBeneficiary.js";
import deleteFromCache from "../../utils/cache/deleteFromCache.js";
import { CashoutCategories } from "../../constants/index.js";
import { CASHOUT_GENERIC_BANK_VALIDATION_REGEX } from "../../constants/regex.js";

const AddCashoutBeneficiary = async (req, res, next) => {
    try {
        const { user: { _id, country: { countryCode }, phoneNumber }, body: { accountType, address, bankName } } = req;
        let { body: { bankAccount = "" } } = req;
        const { translate } = req;

        if (bankAccount) {
            const checkIfBeneFiciaryExist = await CashoutBeneficiary.findOne({ userId: _id, bankAccount, bankName, countryCode }).lean();
            if (checkIfBeneFiciaryExist) throw new ApiError("user_error", 400, translate("cashout_beneficiary_already_exist"), true);
        }
        const bank = await D24Banks.findOne({ bankName, countryCode });
        if (!bank) throw new ApiError("user_error", 400, translate("invalid_bank_name"), true);

        const { category } = bank;
        // bank validations
        if (category === CashoutCategories.BANK) {
            if (!bankAccount) {
                throw new ApiError("requiredFields", 400, translate("bankAccount_required"), true);
            }
            if (!CASHOUT_GENERIC_BANK_VALIDATION_REGEX.test(bankAccount)) {
                throw new ApiError("requiredFields", 400, translate("bank_account_num_must_be_valid"), true);
            }
        }
        if (category === CashoutCategories.CASH) {
            bankAccount = "";
        }
        if (category === CashoutCategories.WALLET) {
            if (["NEQUI", "DAVIPLATA"].includes(bankName)) {
                bankAccount = phoneNumber.replace("+57", "");
            }
            if (!["NEQUI", "DAVIPLATA"].includes(bankName) && !bankAccount) {
                throw new ApiError("requiredFields", 400, translate("bankAccount_required"), true);
            }
            if (!["NEQUI", "DAVIPLATA"].includes(bankName) && bankAccount) {
                if (!CASHOUT_GENERIC_BANK_VALIDATION_REGEX.test(bankAccount)) {
                    throw new ApiError("requiredFields", 400, translate("wallet_account_num_must_be_valid"), true);
                }
            }
        }
        const bankSaveData = {
            accountType,
            bankAccount,
            address,
            bankName,
            countryCode,
            category: bank.category,
            bankDetailsId: bank._id,
            userId: _id,
        };
        const newBankDetails = new CashoutBeneficiary(bankSaveData);
        await newBankDetails.save();
        const key = `cashout-beneficiary:${_id}:${bank.category}`;
        const allDatakey = `cashout-beneficiary:${_id}:`;
        await deleteFromCache([key, allDatakey]);
        return sendSuccessResponse(res, 200, true, translate("create_payee_success"), "createPayee");
    } catch (error) {
        next(error);
    }
    return false;
};

export default AddCashoutBeneficiary;
