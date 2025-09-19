import { createPayment, cashinDynamic } from "./helper.js";
import logger from "../../../logger/index.js";

async function cashinDynamicV2(req, res, next) {
    try {
        const { body: { type: paymentType = "ONEPAY" } } = req;
        if (paymentType.toUpperCase() === "ONEPAY") {
            return await createPayment(req, res, next);
        }
        return await cashinDynamic(req, res, next);
    } catch (err) {
        logger.error(err.message);
    }
    return cashinDynamicV2;
}

export default cashinDynamicV2;
