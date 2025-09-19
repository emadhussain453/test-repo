import Promotions from "../../models/promotions.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { PromotionsType } from "../../constants/index.js";

const getOfferPosts = async (req, res, next) => {
    try {
        const { isActive = "true", type } = req.query;

        const query = {
            isActive: isActive === "true",
            ...(type && { type: PromotionsType[Number(type)] }),
            $or: [
                { isNewImage: false },
                { isNewImage: { $exists: false } },
            ],
        };
        let promotion = await Promotions.find(query).sort({ createdAt: -1 }).lean();
        promotion = promotion.map((promo) => ({
            ...promo,
            frontImage: { base64String: promo.frontImage },
            frontImageV1: { base64String: promo.frontImageV1 },
        }));
        sendSuccessResponse(res, 200, true, "promotions found successfully", "getPromotions", { promotion });
    } catch (error) {
        return next(error);
    }
    return false;
};

export default getOfferPosts;
