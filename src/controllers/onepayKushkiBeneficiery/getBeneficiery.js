/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable require-atomic-updates */
import OnepayKushkBenefeciery from "../../models/onepayKushkiCashoutBenefeciary.js";
import { ApiError } from "../../utils/ApiError.js";
import isValidMdbId from "../../utils/isValidMdbId.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import callApi from "../../utils/callApi.js";
import { Status } from "../../constants/index.js";

const getBeneficiaries = async (req, res, next) => {
    try {
        const { user: { _id, onepayCustomerId }, query: { page = 1, limit = 10, beneficiaryId, createdAt = -1, type } } = req;
        const { translate } = req;

        if (isValidMdbId(beneficiaryId)) {
            const beneficiary = await OnepayKushkBenefeciery.findOne({ _id: beneficiaryId, userId: _id, isDeleted: false });
            if (!beneficiary) throw new ApiError("Invalid details", 400, translate("beneficiary_not_exist"), true);

            if (beneficiary.status === Status.PENDING) {
                const headers = {
                    accept: "application/json",
                    "content-type": "application/json",
                };
                const params = `/${onepayCustomerId}/accounts?page=${page}`;

                const result = await callApi.onepay("onepay", "customerAccounts", "get", null, params, headers);
                if (!result.success) {
                    throw new ApiError("Error in onePay Api", 400, translate("directa_api_error", { message: result.message }), true);
                }

                const match = result.results?.data?.find((acc) => acc.id === beneficiary.onepayAccountId);

                if (match?.status) {
                    const updatedStatus = match.status.toUpperCase();
                    await OnepayKushkBenefeciery.updateOne(
                        { _id: beneficiary._id },
                        { $set: { status: updatedStatus } },
                    );

                    beneficiary.status = updatedStatus;
                }
            }
            const count = await OnepayKushkBenefeciery.countDocuments({ userId: _id, isDeleted: false });
            const finalPayload = {
                beneficiary,
                page: Number(page),
                limit: Number(limit),
                totalCount: count,
            };
            return sendSuccessResponse(res, 200, true, translate("get_payees_success"), "getPayees", finalPayload);
        }

        const query = { userId: _id, isDeleted: false };
        if (type === "TRANSFIYA") {
            query.kushkiAccountType = "NC";
        } else {
            query.kushkiAccountType = { $ne: "NC" };
        }
        const beneficiaries = await OnepayKushkBenefeciery.find(query)
            .sort({ favourite: -1, createdAt })
            .populate({ path: "bankId", select: "name tag isActive logo" });

        if (beneficiaries.some((b) => b.status === Status.PENDING)) {
            const headers = {
                accept: "application/json",
                "content-type": "application/json",
            };
            const params = `/${onepayCustomerId}/accounts?page=${page}`;
            const result = await callApi.onepay("onepay", "customerAccounts", "get", null, params, headers);

            if (!result.success) {
                throw new ApiError("Error in onePay Api", 400, translate("directa_api_error", { message: result.message }), true);
            }

            const onepayAccounts = result.results?.data || [];

            for (const b of beneficiaries) {
                if (b.status === Status.PENDING) {
                    const match = onepayAccounts.find((acc) => acc.id === b.onepayAccountId);
                    if (match?.status) {
                        const newStatus = match.status.toUpperCase();
                        b.status = newStatus;
                        await OnepayKushkBenefeciery.updateOne(
                            { _id: b._id },
                            { $set: { status: newStatus } },
                        );
                    }
                }
            }
        }

        const count = await OnepayKushkBenefeciery.countDocuments(query);
        const finalPayload = {
            beneficiaries,
            page: Number(page),
            limit: Number(limit),
            totalCount: count,
        };

        return sendSuccessResponse(res, 200, true, translate("get_payees_success"), "getPayees", finalPayload);
    } catch (error) {
        next(error);
    }
    return false;
};

export default getBeneficiaries;
