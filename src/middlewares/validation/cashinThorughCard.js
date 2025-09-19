/* eslint-disable camelcase */
import { ApiError } from "../../utils/ApiError.js";

const validation_cashin_through_card = (req, res, next) => {
    const { translate } = req;
    try {
        const { amount, description, cvv, card_number, expiration_month, expiration_year } = req.body;
        const date = new Date();
        let y = date.getFullYear();
        y %= 100;
        if (!(expiration_year >= y)) throw new Error(translate("expiry_year_invalid"));
        if (Number(expiration_month) > 12) throw new Error(translate("expiry_month_invalid"));
        let x = cvv.toString().length;
        if (!(x === 3)) throw new Error(translate("cvv_invalid"));
        x = card_number.toString().length;
        if (!(x === 16)) throw new Error(translate("card_number_invalid"));
        if (typeof amount !== "number") throw new Error(translate("amount_invalid_numeric"));
        if (description.length < 3) throw new Error(translate("description_invalid_length"));
        next();
    } catch (error) {
        throw new ApiError("cashin card validation error", 400, translate("something_went_wrong"), true);
    }
};

export default validation_cashin_through_card;
