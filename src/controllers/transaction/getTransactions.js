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

const getTransactions = async (req, res, next) => {
    try {
        const { user: { _id }, query: { type, page = 1, limit = 10 }, translate } = req;
        if (limit > 100 || !Number.isInteger(Number(limit))) throw new ApiError("Limit error", 400, "Page limit can't be greater then 100 or in decimal", true);
        if (page < 1 || !Number.isInteger(Number(page))) throw new ApiError("Limit error", 400, "Page number can't be less then 1 or in decimal", true);
        const skipDocuments = (Number(page) - 1) * Number(limit);
        if (!Object.values(Types).includes(type)) {
            throw new ApiError("Validation error", 400, translate("invalid_query_type"), true);
        }

        const concatDynamicArrays = [];

        const matchQuery = {
            dynamicRefrence: {},
        };

        if (type === Types.IN) {
            matchQuery.dynamicRefrence.$or = [{ $eq: ["$to", "$$userId"] }];
        }
        if (type === Types.OUT) {
            matchQuery.dynamicRefrence.$or = [{ $eq: ["$from", "$$userId"] }];
        }
        if (type === Types.ALL) {
            matchQuery.dynamicRefrence.$or = [{ $eq: ["$from", "$$userId"] }, { $eq: ["$to", "$$userId"] }];
        }

        const aggregationPipeline = [{
            $match: {
                _id,
                isBlocked: false,
            },
        }];

        if (type === Types.ALL || (type === Types.OUT || type === Types.IN)) {
            aggregationPipeline.push({
                $lookup: {
                    from: "transactions_p2ps",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: matchQuery.dynamicRefrence,
                                // status: { $in: [Status.COMPLETED, Status.PENDING, Status.ON_HOLD] },
                            },
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "from",
                                foreignField: "_id",
                                pipeline: [
                                    {
                                        $project: {
                                            firstName: 1,
                                            lastName: 1,
                                            email: 1,
                                            phoneNumber: 1,
                                            avatar: 1,
                                        },
                                    },
                                ],
                                as: "senderProfile",
                            },
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "to",
                                foreignField: "_id",
                                pipeline: [
                                    {
                                        $project: {
                                            firstName: 1,
                                            lastName: 1,
                                            email: 1,
                                            phoneNumber: 1,
                                            avatar: 1,
                                        },
                                    },
                                ],
                                as: "recieverProfile",
                            },
                        },
                        {
                            $addFields: {
                                type: {
                                    $cond: {
                                        if: { $eq: ["$from", "$$userId"] },
                                        then: "debit",
                                        else: "credit",
                                    },
                                },
                            },
                        },
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                from: { $arrayElemAt: ["$senderProfile", 0] },
                                to: { $arrayElemAt: ["$recieverProfile", 0] },
                                amount: {
                                    $toDouble: {
                                        $ifNull: [
                                            {
                                                $cond: {
                                                    if: { $eq: ["$from", "$$userId"] },
                                                    then: "$amount",
                                                    else: "$receiverAmount",
                                                },
                                            },
                                            "$amount",
                                        ],
                                    },
                                },

                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                oneStableCoin: {
                                    $toDouble: {
                                        $ifNull: ["$fee.oneStableCoin", "$currentExchageRate.selling"],
                                    },
                                },
                                receiverLocalAmount: {
                                    $toDouble: "$receiverLocalAmount",
                                },
                                type: 1,
                                tType: "p2p",
                                status: 1,
                                createdAt: 1,
                                currentExchageRate: {
                                    buying: { $toDouble: "$currentExchageRate.buying" },
                                    selling: { $toDouble: "$currentExchageRate.selling" },
                                    currency: "$currentExchageRate.currency",
                                },
                                receiverCurrentExchageRate: {
                                    buying: { $toDouble: "$receiverCurrentExchageRate.buying" },
                                    selling: { $toDouble: "$receiverCurrentExchageRate.selling" },
                                    currency: "$receiverCurrentExchageRate.currency",
                                },
                            },
                        },
                    ],
                    as: "p2p_transactions",
                },
            });
            concatDynamicArrays.push("$p2p_transactions");
        }
        if (type === Types.ALL || (type === Types.B2C || type === Types.IN)) {
            aggregationPipeline.push({
                $lookup: {
                    from: "business_transactions",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                amount: { $toDouble: "$amount" },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                from: 1,
                                type: "credit",
                                transactionType: "B2C",
                                tType: "b2c",
                                status: 1,
                                createdAt: 1,
                                oneStableCoin: {
                                    $toDouble: {
                                        $ifNull: ["$fee.oneStableCoin", "$currentExchageRate.buying"],
                                    },
                                },
                                currentExchageRate: {
                                    buying: { $toDouble: "$currentExchageRate.buying" },
                                    selling: { $toDouble: "$currentExchageRate.selling" },
                                    currency: "$currentExchageRate.currency",
                                },
                            },
                        },
                    ],
                    as: "business_transactions",
                },
            });
            concatDynamicArrays.push("$business_transactions");
        }
        if (type === Types.OUT || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: "transactions_cashouts",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $project: {
                                amount: { $toDouble: "$amount" },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                type: "cashout",
                                tType: "cashout",
                                createdAt: 1,
                                status: 1,
                                cashoutId: 1,
                                invoiceId: 1,
                                currency: 1,
                                bankName: 1,
                                oneStableCoin: {
                                    $toDouble: {
                                        $ifNull: ["$fee.oneStableCoin", "$currentExchageRate.selling"],
                                    },
                                },
                                currentExchageRate: {
                                    buying: { $toDouble: "$currentExchageRate.buying" },
                                    selling: { $toDouble: "$currentExchageRate.selling" },
                                    currency: "$currentExchageRate.currency",
                                },
                            },
                        }, {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                    ],
                    as: "cashout_transactions",
                },
            });
            concatDynamicArrays.push("$cashout_transactions");
        }

        if (type === Types.OUT || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: "transactions_tapi_services",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $project: {
                                amount: { $toDouble: "$amount" },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                type: "debit",
                                tType: "tapi",
                                transactionType: {
                                    $cond: {
                                        if: { $eq: ["$transactionType", "SERVICE"] },
                                        then: "BILL",
                                        else: "$transactionType",
                                    },
                                },
                                oneStableCoin: {
                                    $toDouble: {
                                        $ifNull: ["$fee.oneStableCoin", "$currentExchangeRate.selling"],
                                    },
                                },
                                createdAt: 1,
                                status: 1,
                                currency: 1,
                                identifiers: "$metadata.identifiers",
                                companyLogo: "$metadata.companyLogo",
                                companyName: "$metadata.companyName",
                                companyCode: "$metadata.companyCode",
                                externalClientId: "$metadata.externalClientId",
                                externalRequestId: "$metadata.externalRequestId",
                                agent: "$metadata.agent",
                                paymentMethod: "$metadata.paymentMethod",
                                amountType: "$metadata.amountType",
                                operationId: "$metadata.operationId",
                                productDescription: "$metadata.productDescription",
                                activatePin: "$metadata.activatePin",
                                externalPaymentId: "$metadata.externalPaymentId",
                                currentExchageRate: {
                                    buying: { $toDouble: "$currentExchangeRate.buying" },
                                    selling: { $toDouble: "$currentExchangeRate.selling" },
                                    currency: "$currentExchangeRate.currency",
                                },
                            },
                        }, {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                    ],
                    as: "transactions_tapi",
                },
            });
            concatDynamicArrays.push("$transactions_tapi");
        }
        if (type === Types.OUT || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: "transactions_travel_services",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $project: {
                                amount: { $toDouble: "$amount" },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                validationId: "$metadata.validationId",
                                status: "$metadata.status",
                                travelItineraryId: "$metadata.travelItineraryId",
                                reservationId: "$metadata.reservationId",
                                metadata: 1,
                                type: "debit",
                                tType: "travel",
                                createdAt: 1,
                                currency: 1,
                                oneStableCoin: {
                                    $toDouble: {
                                        $ifNull: ["$fee.oneStableCoin", "$currentExchangeRate.selling"],
                                    },
                                },
                                currentExchageRate: {
                                    buying: { $toDouble: "$currentExchangeRate.buying" },
                                    selling: { $toDouble: "$currentExchangeRate.selling" },
                                    currency: "$currentExchangeRate.currency",
                                },
                            },
                        }, {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                    ],
                    as: "transactions_travel",
                },
            });
            concatDynamicArrays.push("$transactions_travel");
        }
        if (type === Types.IN || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: StableModelsNames.CASHIN_V1,
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $project: {
                                amount: { $toDouble: "$amount" },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                type: "cashin",
                                tType: "cashin",
                                createdAt: 1,
                                status: 1,
                                depositId: 1,
                                invoiceId: 1,
                                paymentInfo: {
                                    $cond: {
                                        if: { $eq: ["$type", "onepay"] },
                                        then: { methodName: "Whatsapp" },
                                        else: { methodName: "$paymentInfo.methodName" },
                                    },
                                },
                                currency: 1,
                                description: 1,
                                oneStableCoin: {
                                    $toDouble: {
                                        $ifNull: ["$fee.oneStableCoin", "$currentExchangeRate.buying"],
                                    },
                                },
                                currentExchageRate: {
                                    buying: { $toDouble: "$currentExchangeRate.buying" },
                                    selling: { $toDouble: "$currentExchangeRate.selling" },
                                    currency: "$currentExchangeRate.currency",
                                },
                            },
                        }, {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                    ],
                    as: "cashin_transactions_v1",
                },
            });
            concatDynamicArrays.push("$cashin_transactions_v1");
        }

        if (type === Types.CARD || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: "transactions_cards",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $addFields: {
                                isCard: true,
                            },
                        },
                        {
                            $project: {
                                amount: {
                                    $toDouble: "$amount",
                                },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                card: 1,
                                createdAt: 1,
                                status: 1,
                                type: 1,
                                tType: "card",
                                isCard: "$isCard",
                                method: 1,
                                merchant: 1,
                                transaction: 1,
                                oneStableCoin: {
                                    $toDouble: {
                                        $ifNull: ["$fee.oneStableCoin", "$currentExchageRate.selling"],
                                    },
                                },
                                pomeloWebhooksAmountDetails: {
                                    local: {
                                        total: { $toDouble: "$pomeloWebhooksAmountDetails.local.total" },
                                        currency: "$pomeloWebhooksAmountDetails.local.currency",
                                    },
                                    transaction: {
                                        total: { $toDouble: "$pomeloWebhooksAmountDetails.transaction.total" },
                                        currency: "$pomeloWebhooksAmountDetails.transaction.currency",
                                    },
                                    settlement: {
                                        total: { $toDouble: "$pomeloWebhooksAmountDetails.settlement.total" },
                                        currency: "$pomeloWebhooksAmountDetails.settlement.currency",
                                    },
                                    details: "$pomeloWebhooksAmountDetails.details",
                                },
                                currentExchageRate: {
                                    buying: { $toDouble: "$currentExchageRate.buying" },
                                    selling: { $toDouble: "$currentExchageRate.selling" },
                                    currency: "$currentExchageRate.currency",
                                },
                            },
                        },
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                    ],
                    as: "card_transactions",
                },
            });
            concatDynamicArrays.push("$card_transactions");
        }

        if (type === Types.OUT || type === Types.FEE || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: "transactions_fees",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $project: {
                                amount: {
                                    $toDouble: "$amount",
                                },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                createdAt: 1,
                                status: 1,
                                tType: "fee",
                                type: "debit",
                                oneStableCoin: {
                                    $toDouble: {
                                        $ifNull: ["$fee.oneStableCoin", "$currentExchageRate.selling"],
                                    },
                                },
                                currentExchageRate: {
                                    buying: { $toDouble: "$currentExchageRate.buying" },
                                    selling: { $toDouble: "$currentExchageRate.selling" },
                                    currency: "$currentExchageRate.currency",
                                },
                                feeType: 1,
                            },
                        },
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                    ],
                    as: "transactions_fee",
                },
            });
            concatDynamicArrays.push("$transactions_fee");
        }
        aggregationPipeline.push({
            $project: {
                _id: "$_id",
                email: 1,
                firstName: 1,
                lastName: 1,
                isVerified: 1,
                transactions: {
                    $concatArrays: concatDynamicArrays,
                },
                totalCount: {
                    $size: {
                        $concatArrays: concatDynamicArrays,
                    },
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
        });

        const transactions = await Users.aggregate(aggregationPipeline);
        const totalPages = Math.ceil(Number(transactions[0]?.totalCount ?? 0) / limit);
        const finalResponse = {
            _id: transactions[0]?._id,
            email: transactions[0]?.email ?? "",
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
