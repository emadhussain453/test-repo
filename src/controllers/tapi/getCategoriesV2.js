/* eslint-disable no-nested-ternary */
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Category from "../../models/tapiCategories.js";

const types = {
    PAYBILL: "PAYBILL",
    SUBSCRIPTION: "SUBSCRIPTION",
};

const getCategoriesV2 = async (req, res, next) => {
    try {
        const { t: translate } = req;
        const { type } = req.query;

        const query = type ? { type } : {};
        const populateField = type === types.PAYBILL
            ? {
                path: "tags",
                match: { totalCompanies: { $gt: 0 } },
            }
            : type === types.SUBSCRIPTION
                ? "companies"
                : "";

        // Fetch all categories and populate tags
        const categories = await Category.find(query).populate(populateField);
        const finalPayload = {
            categories,
        };

        return sendSuccessResponse(res, 200, true, translate("categories_fetched"), "Categories Fetched", finalPayload);
    } catch (error) {
        return next(error);
    }
};

export default getCategoriesV2;
