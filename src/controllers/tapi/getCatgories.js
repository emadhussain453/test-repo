/* eslint-disable no-nested-ternary */
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import Category from "../../models/tapiCategories.js";
import { Lenguages } from "../../constants/index.js";

const getCategories = async (req, res, next) => {
    try {
        const { t: translate } = req;

        // Fetch all categories and populate tags
        const language = req.headers["accept-language"] || Lenguages.English;
        const categories = await Category.find({ type: "PAYBILL" }).populate({ path: "tags" });
        const finalCategories = categories.map((category) => ({
            ...category.toObject(),
            name: language === Lenguages.English ? category.name.en : category.name.es,
        }));

        // Final response payload
        const finalPayload = {
            categories: finalCategories,
        };

        return sendSuccessResponse(res, 200, true, translate("categories_fetched"), "Categories Fetched", finalPayload);
    } catch (error) {
        return next(error);
    }
};

export default getCategories;
