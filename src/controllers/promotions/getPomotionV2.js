import moment from "moment";
import Promotions from "../../models/promotions.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { PromotionsType } from "../../constants/index.js";

const getPromotionV2 = async (req, res, next) => {
    try {
        const { isActive = "true", type } = req.query;

        const query = {
            isActive: isActive === "true",
            ...(type && { type: PromotionsType[Number(type)] }),
            $or: [
                { isNewImage: true },
                { isOldPromotionImageUpdated: true },
            ],
            $and: [
                {
                    $or: [
                        { expiryTime: { $exists: false } },
                        { expiryTime: null },
                        { expiryTime: { $gte: moment.utc() } },
                    ],
                },
            ],
        };
        let promotion = await Promotions.find(query).sort({ publishTime: -1 }).lean();
        promotion = promotion.map((promo) => ({
            ...promo,
            frontImageV1: { base64String: promo.frontImageV1 },
            thumbnailImage: { base64String: promo.thumbnailImage },
        }));
        sendSuccessResponse(res, 200, true, "promotions found successfully", "getPromotions", { promotion });
    } catch (error) {
        return next(error);
    }
    return false;
};

export default getPromotionV2;
