import moment from "moment";
import PaymentLinks from "../../models/paymentLinks.js";
import { CountryCurrencies, Status } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import getStatusHistoryObject from "../../utils/getStatusHistoryObject.js";
import getFeeObjectForCashin from "../../utils/exchangeRates/calculateFeeForDirectaCashin.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import calculateOneStableCoin from "../../utils/calculateOneStableCoin.js";
import isValidMdbId from "../../utils/isValidMdbId.js";

async function getPaymentLinkDetails(req, res, next) {
    try {
        // add input validations
        const { params: { plId }, query: { countryCode = "COL" }, t: translate } = req;
        if (!plId) throw new ApiError("payment_link", 400, translate("payment_link_id_required"), true);
        if (!isValidMdbId(plId)) throw new ApiError("validation_error", 400, translate("payment_link_id_invalid"), true);
        // check if plid exists
        const selectFiled = "amount description status expiresAt initiatePayment serviceLinkExpiresAt payerPersonalDetails payerPaymentDetails serviceCheckoutURL statusHistory";
        const isPaymentLink = await PaymentLinks.findOne({ _id: plId }).populate({
            path: "userId",
            select: "email firstName lastName avatar phoneNumber country",
        }).select(selectFiled);

        if (!isPaymentLink) {
            throw new ApiError("payment_link", 400, translate("payment_link_not_exist"), true);
        }
        if (isPaymentLink.status === Status.COMPLETED) {
            const finalPayload = {
                paymentLink: isPaymentLink,
                isCompleted: true,
            };
            return sendSuccessResponse(res, 200, true, false, "getPaymentLink", finalPayload);
        }

        // check if PL is expired
        const currentUTC = moment().utc();
        const expiresAt = moment(isPaymentLink.expiresAt).utc();
        if (!expiresAt.isAfter(currentUTC)) {
            // set the payment_link as expired
            const updateQueryPl = {
                $set: { status: Status.EXPIRED },
                $push: { statusHistory: getStatusHistoryObject(Status.EXPIRED, true) },
            };
            await PaymentLinks.updateOne({ _id: plId }, updateQueryPl);
            throw new ApiError("paumentLink", 400, translate("payment_link_expired"), true);
        }

        const { amount } = isPaymentLink;
        // get the amount exchange rates
        const paymentService = "DIRECTA24";
        const serviceFeture = "CASHIN";
        const currency = CountryCurrencies[countryCode];
        const { amount: feeAmount } = await getFeeObjectForCashin(amount, paymentService, serviceFeture, countryCode, false);
        const totalAmount = amount + feeAmount;
        const exRates = await getExchangeRate(currency);
        const totalLocalCurrency = convertToRequiredDecimalPlaces(totalAmount * exRates.buying);
        const finalResponse = {
            amount,
            totalLocalCurrency,
            oneStableCoin: calculateOneStableCoin(totalLocalCurrency, amount),
        };
        const finalPayload = {
            paymentLink: isPaymentLink,
            amountExchangeRateDetail: finalResponse,
        };
        return sendSuccessResponse(res, 200, true, false, "getPaymentLink", finalPayload);
    } catch (error) {
        return next(error);
    }
}

export default getPaymentLinkDetails;
