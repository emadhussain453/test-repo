import moment from "moment-timezone";
import keys from "../../config/keys.js";
import { StableActiveCountryCodes, Status } from "../../constants/index.js";
import PaymentLinks from "../../models/paymentLinks.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import getStatusHistoryObject from "../../utils/getStatusHistoryObject.js";
import { ApiError } from "../../utils/ApiError.js";
import getAppConfig from "../../utils/getAppConfig.js";

async function createPaymentLink(req, res, next) {
    try {
        const { user: { _id, country: { countryCode } }, body: { amount, description: userDescription }, translate } = req;
        if (countryCode !== StableActiveCountryCodes.COL && countryCode !== StableActiveCountryCodes.MEX) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }
        const description = `external|${userDescription}`;
        const app = await getAppConfig();
        if (!app) throw new ApiError("invalid details", 400, translate("app_config_not_found"), true);
        if (amount < app.cashin.minLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_minimum_amount", { amount: app.cashin.minLimit }), true);
        if (amount > app.cashin.maxLimit) throw new ApiError("Invalid Amount", 400, translate("cashin_maximum_amount", { amount: app.cashin.maxLimit }), true);

        // create paymentLink in database
        const plPayloadToSave = {
            userId: _id,
            amount,
            description,
            status: Status.PENDING,
            expiresAt: moment.utc().add(keys.PAYMENT_LINK.EXPIRY || 15, "minutes"),
            statusHistory: getStatusHistoryObject(Status.PENDING, true),
        };
        const savedPL = await PaymentLinks.create(plPayloadToSave);
        const { _id: plId } = savedPL;

        const paymentLink = `${keys.STABLE_PAYMENT_LINK_DOMAIN}/${plId}`;
        const finalPayload = {
            paymentLink,
        };
        return sendSuccessResponse(res, 200, true, translate("Payment_link_created_successfully"), "createPaymentLink", finalPayload);
    } catch (error) {
        return next(error);
    }
}

export default createPaymentLink;
