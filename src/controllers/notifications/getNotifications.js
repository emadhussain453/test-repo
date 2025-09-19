import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Notifications from "../../models/notifications.js";

const getNotifications = async (req, res, next) => {
    try {
        const { user } = req;
        const { page = 1, limit = 10 } = req.query;
        const { translate } = req;
        const skip = (page - 1) * limit;
        if (limit > 100 || !Number.isInteger(Number(limit))) throw new ApiError("Limit error", 400, translate("invalid_limit"), true);

        const aggregationQuery = [
            {
                $match: {
                    $or: [
                        { userId: user._id },
                        {
                            $and: [
                                { to: "toAllVerified" },
                                { $expr: { $gt: ["$createdAt", user.kycVerifiedAt] } },
                            ],
                        },
                    ],
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
            {
                $skip: Number(skip),
            },
            {
                $limit: Number(limit),
            },
            {
                $project: {
                    title: 1,
                    en: "$message",
                    es: "$spanishMessage",
                    read: 1,
                    createdAt: 1,
                    message: 1,
                },
            },
        ];

        const query = {
            $or: [
                { userId: user._id },
                {
                    $and: [
                        { to: "toAllVerified" },
                        { $expr: { $gt: ["$createdAt", user.kycVerifiedAt] } },
                    ],
                },
            ],
        };

        const [notifications, totalCount] = await Promise.all([
            Notifications.aggregate(aggregationQuery),
            Notifications.countDocuments(query),
        ]);

        const responseData = {
            notifications,
            totalCount,
            page: Number(page),
            limit: Number(limit),
        };

        sendSuccessResponse(res, 200, true, translate("all_notifications"), "getNotifications", responseData);
    } catch (error) {
        next(error);
    }
};

export default getNotifications;
