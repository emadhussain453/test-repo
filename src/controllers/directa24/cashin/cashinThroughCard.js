/* eslint-disable camelcase */
import mongoose from "mongoose";
import sendSuccessResponse from "../../../utils/responses/sendSuccessResponse.js";
import generateUniqueId from "../../../utils/generateUniqueId.js";
import createAuthHash from "../../../utils/directa24/createAuthHash.js";
import callApi from "../../../utils/callApi.js";
import TransactionsCashIn from "../../../models/directaCashin.js";
import logger from "../../../logger/index.js";
import { Payvalida, Status } from "../../../constants/index.js";
import { ApiError } from "../../../utils/ApiError.js";
import Users from "../../../models/users.js";
import UserBalance from "../../../models/userBalance.js";
import updateBalance from "../../../utils/balanceUpdate.js";

async function cashinThroughCard(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session, new: true };

    try {
        const { _id, email, firstName, lastName, phoneNumber, userBalance } = req.user;
        const { translate, userIpAddress } = req;
        const { amount, description, cvv, card_number, expiration_month, expiration_year } = req.body;

        const invoiceId = generateUniqueId("cashin");
        const apiBody = {
            invoice_id: invoiceId,
            amount: `${amount}`,
            country: Payvalida.country,
            currency: Payvalida.currency,
            payer: {
                id: _id,
                // "document_type": "CC",
                // document: "84932568207",  //  not reuired but if given then it should be valid
                first_name: firstName,
                last_name: lastName,
                email,
                phone: phoneNumber,
            },
            credit_card: {
                cvv,
                card_number,
                expiration_month,
                expiration_year,
                holder_name: `${firstName} ${lastName}`, // if user is using someone else card it goes invalid
            },
            description, // not required
            test: true,
            mobile: false,
            language: "en",

        };
        const authHeaders = createAuthHash(apiBody);
        // print("he", header);
        const result = await callApi.callDirecta24Api("directa24CashInThroughCard", "cashInThorughCard", "POST", apiBody, false, authHeaders);
        if (!result.success) {
            logger.error(`D24 :: ${result.message}`);
            throw new ApiError("Error in directa Api", 400, translate("something_went_wrong"), true);
        }

        const { deposit_id, payment_info: { type, result: piResult, payment_method, payment_method_name, amount: piAmount, currency, created_at } } = result.results;
        const invoivcedata = {
            userId: _id,
            invoiceId,
            depositId: deposit_id,
            amount, // must be a string
            description,
            status: Status.COMPLETED,
            transactionType: "credit",
            currency,
            type: "CARD",
            userIpAddress,
            paymentInfo: {
                type,
                status: piResult === "SUCCESS" && Status.COMPLETED,
                method: payment_method,
                methodName: payment_method_name,
                amount: piAmount,
                createdAt: created_at,
            },
        };
        const newInvoice = new TransactionsCashIn(invoivcedata);
        await newInvoice.save(opts);

        // now update the user balance
        const extraPayload = {
            opts,
            translate,
        };
        const balanceUpdateToUser = userBalance.userId;
        await updateBalance(balanceUpdateToUser, amount, extraPayload);
        await session.commitTransaction();
        session.endSession();
        return sendSuccessResponse(res, 200, true, translate("invoice_created_success"), "cashinCard", result.results);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
}
export default cashinThroughCard;
