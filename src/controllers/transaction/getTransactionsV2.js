import { StableModelsNames } from "../../constants/index.js";
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const Types = {
    IN: "in",
    OUT: "out",
    ALL: "all",
    B2C: "b2c",
    FEE: "fee",
    CARD: "card",
};

function makeQuery(userId, type) {
    const query = {};
    if (type === Types.ALL) {
        query.$or = [
            { userId },
            { from: userId },
            { to: userId },
        ];
    } else if (type === Types.IN) {
        query.$or = [
            { transactionModel: StableModelsNames.P2P, to: userId },
            { transactionModel: StableModelsNames.CASHIN_V1, userId },
            { transactionModel: StableModelsNames.B2C, userId },

        ];
    } else if (type === Types.OUT) {
        query.$or = [
            { transactionModel: StableModelsNames.P2P, from: userId },
            { transactionModel: StableModelsNames.CASHOUT, userId },
            { transactionModel: StableModelsNames.FEE, userId },
        ];
    } else if (type === Types.CARD) {
        query.transactionModel = StableModelsNames.CARD;
        query.userId = userId;
    } else if (type === Types.FEE) {
        query.transactionModel = StableModelsNames.FEE;
        query.userId = userId;
    } else if (type === Types.B2C) {
        query.transactionModel = StableModelsNames.B2C;
        query.userId = userId;
    }
    return query;
}
const getTransactions = async (req, res, next) => {
    try {
        const { user: { _id }, query: { type, page = 1, limit = 10 }, translate } = req;
        if (limit > 100 || !Number.isInteger(Number(limit))) throw new ApiError("Limit error", 400, "Page limit can't be greater then 100 or in decimal", true);
        if (page < 1 || !Number.isInteger(Number(page))) throw new ApiError("Limit error", 400, "Page number can't be less then 1 or in decimal", true);
        const skipDocuments = (Number(page) - 1) * Number(limit);
        if (!Object.values(Types).includes(type)) {
            throw new ApiError("Validation error", 400, translate("invalid_query_type"), true);
        }
        const query = makeQuery(_id, type);

        const aggregationPipeline = [{
            $match: {
                _id,
                isBlocked: false,
            },
        }, {
            $addFields: {
                balance: { $toDouble: "$balance" }, // convert Decimal128 to plain JavaScript number
            },
        }, {
            $lookup: {
                from: "transactions",
                pipeline: [
                    {
                        $match: query,
                    },
                    // {
                    //     $addFields: {
                    //         type: {
                    //             $cond: {
                    //                 if: { $eq: ["$from", "$$userId"] },
                    //                 then: "debit",
                    //                 else: "credit",
                    //             },
                    //         },
                    //     },
                    // },
                    {
                        $sort: {
                            createdAt: -1,
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            // from: { $arrayElemAt: ["$senderProfile", 0] },
                            // to: { $arrayElemAt: ["$recieverProfile", 0] },
                            amount: { $toDouble: "$amount" },
                            localAmount: {
                                $toDouble: "$localAmount",
                            },
                            receiverLocalAmount: {
                                $toDouble: "$receiverLocalAmount",
                            },
                            type: 1,
                            tType: "$transactionModel",
                            status: 1,
                            createdAt: 1,
                            // currentExchageRate: 1,
                            // receiverCurrentExchageRate: 1,
                            currentExchageRate: {
                                buying: { $toDouble: "$metaData.currentExchageRate.buying" },
                                selling: { $toDouble: "$metaData.currentExchageRate.selling" },
                                currency: "$metaData.currentExchageRate.currency",
                            },
                            receiverCurrentExchageRate: {
                                buying: { $toDouble: "$metaData.receiverCurrentExchageRate.buying" },
                                selling: { $toDouble: "$metaData.receiverCurrentExchageRate.selling" },
                                currency: "$metaData.receiverCurrentExchageRate.currency",
                            },
                        },
                    },
                ],
                as: "transactions",
            },
        }, {
            $project: {
                _id: "$_id",
                email: 1,
                balance: 1,
                firstName: 1,
                lastName: 1,
                isVerified: 1,
                transactions: "$transactions",
                totalCount: {
                    $size: "$transactions",
                },
            },
        }, {
            $unwind: {
                path: "$transactions",
            },
        }, {
            $sort: {
                "transactions.createdAt": -1,
            },
        }, {
            $skip: Number(skipDocuments),
        }, {
            $limit: Number(limit),
        }, {
            $group: {
                _id: "$_id",
                balance: {
                    $first: { $toDouble: "$balance" },
                },
                email: {
                    $first: "$email",
                },
                firstName: {
                    $first: "$firstName",
                },
                lastName: {
                    $first: "$lastName",
                },
                transactions: {
                    $push: "$transactions",
                },
                totalCount: {
                    $first: "$totalCount",
                },
            },
        }];

        const transactions = await Users.aggregate(aggregationPipeline);
        const totalPages = Math.ceil(Number(transactions[0]?.totalCount ?? 0) / limit);
        const finalResponse = {
            _id: transactions[0]?._id,
            email: transactions[0]?.email ?? "",
            balance: transactions[0]?.balance ?? 0,
            transactions: transactions[0]?.transactions ?? [],
            limit: Number(limit),
            page: Number(page),
            skip: skipDocuments,
            totalCount: transactions[0]?.totalCount ?? 0,
            totalPages,
        };
        return sendSuccessResponse(res, 200, true, translate("transaction_completed"), type, finalResponse);
    } catch (error) {
        next(error);
    }
    return false;
};

export default getTransactions;
