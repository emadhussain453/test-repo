/* eslint-disable import/no-extraneous-dependencies */
import moment from "moment";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";
import EstatementTemplate from "../../templates/eStatementTemplate.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import logger from "../../logger/index.js";
import { CountryCurrencies, Lenguages, StableModelsNames, Status } from "../../constants/index.js";
import Users from "../../models/users.js";
import { DATE_REGEX } from "../../constants/regex.js";
import EstatementTemplateSpanish from "../../templates/eStatemnetTemplateSpanish.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import sendEmailWithSES from "../../config/sesEmail.js";

const Types = {
    IN: "in",
    OUT: "out",
    ALL: "all",
    B2C: "b2c",
    CARD: "card",
    FEE: "fee",
};
function formatDateRange(startDate, endDate) {
    const start = moment(startDate);
    const end = moment(endDate);
    const startFormatted = start.format("D MMM");
    const endFormatted = end.format("D MMM");
    const yearFormatted = end.format("YYYY");
    return `${startFormatted} - ${endFormatted}, ${yearFormatted}`;
}

const isDateEarlierThan1year = (dateString) => {
    const currentDate = moment();
    const yearAgo = currentDate.subtract(1, "year");
    const inputDate = moment(dateString, "YYYY-MM-DD");
    return inputDate.isBefore(yearAgo);
};

async function convertHtmlToPdf(htmlContent, outputPath) {
    try {
        const browser = await puppeteer.launch({
            executablePath: "/usr/bin/chromium-browser",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            timeout: 30000,
            headless: true,
            defaultViewport: null,
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });
        await page.pdf({ path: outputPath, format: "A4" });
        await browser.close();
    } catch (error) {
        throw new Error(error);
    }
}
const generateEstatement = async (req, res, next) => {
    let filePath = "";
    try {
        const { user: { _id, email, firstName, lastName, userBalance: { balance }, country: { countryCode }, address: { street, city } }, translate, query: { startDate, endDate, type } } = req;
        if (!startDate) throw new ApiError("Invalid request", 400, translate("date_required", { name: "startDate" }), true);
        if (!endDate) throw new ApiError("Invalid request", 400, translate("date_required", { name: "endDate" }), true);
        if (!startDate.match(DATE_REGEX)) throw new ApiError("Invalid request", 400, translate("date_invalid_format", { name: "startDate" }), true);
        if (!endDate.match(DATE_REGEX)) throw new ApiError("Invalid request", 400, translate("date_invalid_format", { name: "endDate" }), true);
        if (isDateEarlierThan1year(startDate)) throw new ApiError("Invalid request", 400, translate("invalid_date_range"), true);

        if (!Object.values(Types).includes(type)) throw new ApiError("Validation error", 400, translate("invalid_query_type"), true);
        const userAddress = `${street || ""} ${city || ""}`;
        const concatDynamicArrays = [];
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(`${startDate}T00:00:00.000Z`);
        if (endDate) dateFilter.$lte = new Date(`${endDate}T23:59:59.999Z`);

        // calculating transations
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
                                status: { $in: [Status.COMPLETED] },
                                createdAt: dateFilter,
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
                                receiverLastBalance: { $toDouble: "$receiverLastBalance" },
                                senderLastBalance: { $toDouble: "$senderLastBalance" },
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
                                    $toDouble: {
                                        $ifNull: [
                                            {
                                                $cond: {
                                                    if: { $eq: ["$from", "$$userId"] },
                                                    then: "$localAmount",
                                                    else: "$receiverLocalAmount",
                                                },
                                            },
                                            "$localAmount",
                                        ],
                                    },
                                },
                                type: 1,
                                transactionType: "P2P",
                                createdAt: 1,
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                transactions: { $push: "$$ROOT" },
                                totalCreditAmount: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0],
                                    },
                                },
                                totalDebitAmount: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0],
                                    },
                                },
                                totalCreditLocalAmount: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", "credit"] }, "$localAmount", 0],
                                    },
                                },
                                totalDebitLocalAmount: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", "debit"] }, "$localAmount", 0],
                                    },
                                },
                            },
                        },
                    ],
                    as: "p2p_transactions",
                },
            });
            const P2ptransactions = {
                $ifNull: [{ $arrayElemAt: ["$p2p_transactions.transactions", 0] }, []],
            };
            concatDynamicArrays.push(P2ptransactions);
        }

        if (type === Types.ALL || (type === Types.B2C || type === Types.IN)) {
            aggregationPipeline.push({
                $lookup: {
                    from: "business_transactions",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $match: {
                                status: { $in: [Status.COMPLETED] },
                                createdAt: dateFilter,
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
                                amount: { $toDouble: "$amount" },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                userLastBalance: { $toDouble: "$userLastBalance" },
                                type: "credit",
                                status: 1,
                                createdAt: 1,
                                transactionType: "B2C",
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                transactions: { $push: "$$ROOT" },
                                totalB2CAmount: {
                                    $sum: "$amount",
                                },
                                totalB2CLocalAmount: {
                                    $sum: "$localAmount",
                                },
                            },
                        },
                    ],
                    as: "business_transactions",
                },
            });
            const B2ctransactions = {
                $ifNull: [{ $arrayElemAt: ["$business_transactions.transactions", 0] }, []],
            };
            concatDynamicArrays.push(B2ctransactions);
        }
        if (type === Types.OUT || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: "transactions_cashouts",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $match: {
                                status: { $in: [Status.COMPLETED, Status.DELIVERED, Status.PENDING] },
                                createdAt: dateFilter,
                            },
                        },
                        {
                            $project: {
                                amount: { $toDouble: "$amount" },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                status: 1,
                                type: "debit",
                                method: "$bankName",
                                userLastBalance: {
                                    $toDouble: "$userLastBalance",
                                },
                                transactionType: "cashout",
                                createdAt: 1,
                            },
                        }, {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                transactions: { $push: "$$ROOT" },
                                totalCashoutAmount: {
                                    $sum: "$amount",
                                },
                                totalCashoutLocalAmount: {
                                    $sum: "$localAmount",
                                },
                            },
                        },
                    ],
                    as: "cashout_transactions",
                },
            });
            const Cashouttransactions = {
                $ifNull: [{ $arrayElemAt: ["$cashout_transactions.transactions", 0] }, []],
            };
            concatDynamicArrays.push(Cashouttransactions);
        }

        if (type === Types.OUT || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: "transactions_tapi_services",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $match: {
                                status: { $in: [Status.COMPLETED] },
                                createdAt: dateFilter,
                            },
                        },
                        {
                            $project: {
                                amount: { $toDouble: "$amount" },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                status: 1,
                                type: "debit",
                                method: "tapi",
                                userLastBalance: {
                                    $toDouble: "$userLastBalance",
                                },
                                transactionType: 1,
                                createdAt: 1,
                            },
                        }, {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                transactions: { $push: "$$ROOT" },
                                totalCashoutAmount: {
                                    $sum: "$amount",
                                },
                                totalCashoutLocalAmount: {
                                    $sum: "$localAmount",
                                },
                            },
                        },
                    ],
                    as: "transactions_tapi",
                },
            });
            const Cashouttransactions = {
                $ifNull: [{ $arrayElemAt: ["$transactions_tapi.transactions", 0] }, []],
            };
            concatDynamicArrays.push(Cashouttransactions);
        }
        if (type === Types.IN || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: StableModelsNames.CASHIN_V1,
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $match: {
                                status: { $in: [Status.COMPLETED] },
                                createdAt: dateFilter,
                            },
                        },
                        {
                            $project: {
                                userLastBalance: {
                                    $toDouble: "$userLastBalance",
                                },
                                amount: { $toDouble: "$amount" },
                                localAmount: {
                                    $toDouble: "$localAmount",
                                },
                                type: "credit",
                                method: "$type",
                                transactionType: "cashin",
                                createdAt: 1,
                            },
                        }, {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                transactions: { $push: "$$ROOT" },
                                totalCashinAmount: {
                                    $sum: "$amount",
                                },
                                totalCashinLocalAmount: {
                                    $sum: "$localAmount",
                                },
                            },
                        },
                    ],
                    as: "cashin_transactions_v1",
                },
            });
            const CashintransactionsV1 = {
                $ifNull: [{ $arrayElemAt: ["$cashin_transactions_v1.transactions", 0] }, []],
            };
            concatDynamicArrays.push(CashintransactionsV1);
        }

        if (type === Types.FEE || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: "transactions_fees",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $match: {
                                status: { $in: [Status.COMPLETED] },
                                createdAt: dateFilter,
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
                                userLastBalance: {
                                    $toDouble: "$userLastBalance",
                                },
                                createdAt: 1,
                                type: "fee",
                                transactionType: 1,
                            },
                        },
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                transactions: { $push: "$$ROOT" },
                                totalFeeAmount: {
                                    $sum: "$amount",
                                },
                                totalFeeLocalAmount: {
                                    $sum: "$localAmount",
                                },
                            },
                        },
                    ],
                    as: "fee_transactions",
                },
            });
            const Feetransactions = {
                $ifNull: [{ $arrayElemAt: ["$fee_transactions.transactions", 0] }, []],
            };
            concatDynamicArrays.push(Feetransactions);
        }
        if (type === Types.CARD || type === Types.ALL) {
            aggregationPipeline.push({
                $lookup: {
                    from: "transactions_cards",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [
                        {
                            $match: {
                                status: { $in: [Status.COMPLETED] },
                                createdAt: dateFilter,
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
                                userLastBalance: {
                                    $toDouble: "$userLastBalance",
                                },
                                createdAt: 1,
                                type: 1,
                                transactionType: "card",
                            },
                        },
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                transactions: { $push: "$$ROOT" },
                                totalCardAmountDebit: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0],
                                    },
                                },
                                totalCardAmountCredit: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0],
                                    },
                                },
                                totalCardLocalAmountDebit: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", "debit"] }, "$localAmount", 0],
                                    },
                                },
                                totalCardLocalAmountCredit: {
                                    $sum: {
                                        $cond: [{ $eq: ["$type", "credit"] }, "$localAmount", 0],
                                    },
                                },
                            },
                        },
                    ],
                    as: "card_transactions",
                },
            });
            const Cardtransactions = {
                $ifNull: [{ $arrayElemAt: ["$card_transactions.transactions", 0] }, []],
            };
            concatDynamicArrays.push(Cardtransactions);
        }

        aggregationPipeline.push({
            $project: {
                _id: "$_id",
                // p2p data
                totalP2pCreditAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$p2p_transactions.totalCreditAmount", 0],
                    },
                },
                totalP2pDebitAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$p2p_transactions.totalDebitAmount", 0],
                    },
                },
                totalP2pCreditLocalAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$p2p_transactions.totalCreditLocalAmount", 0],
                    },
                },
                totalP2pDebitLocalAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$p2p_transactions.totalDebitLocalAmount", 0],
                    },
                },

                // business data
                totalB2cAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$business_transactions.totalB2CAmount", 0],
                    },
                },
                totalB2cLocalAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$business_transactions.totalB2CLocalAmount", 0],
                    },
                },

                // cashin data
                totalCashinAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$cashin_transactions_v1.totalCashinAmount", 0],
                    },
                },
                totalCashinLocalAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$cashin_transactions_v1.totalCashinLocalAmount", 0],
                    },
                },
                // cashout data
                totalCashoutAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$cashout_transactions.totalCashoutAmount", 0],
                    },
                },
                totalCashoutLocalAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$cashout_transactions.totalCashoutLocalAmount", 0],
                    },
                },
                totalTapiCashoutAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$transactions_tapi.totalCashoutAmount", 0],
                    },
                },
                totalTapiCashoutLocalAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$transactions_tapi.totalCashoutLocalAmount", 0],
                    },
                },
                totalCardAmountCredit: {
                    $toDouble: {
                        $arrayElemAt: ["$card_transactions.totalCardAmountCredit", 0],
                    },
                },
                totalCardAmountDebit: {
                    $toDouble: {
                        $arrayElemAt: ["$card_transactions.totalCardAmountDebit", 0],
                    },
                },
                totalCardLocalAmountCredit: {
                    $toDouble: {
                        $arrayElemAt: ["$card_transactions.totalCardLocalAmountCredit", 0],
                    },
                },
                totalCardLocalAmountDebit: {
                    $toDouble: {
                        $arrayElemAt: ["$card_transactions.totalCardLocalAmountDebit", 0],
                    },
                },

                // fee data
                totalFeeAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$fee_transactions.totalFeeAmount", 0],
                    },
                },
                totalFeeLocalAmount: {
                    $toDouble: {
                        $arrayElemAt: ["$fee_transactions.totalFeeLocalAmount", 0],
                    },
                },
                transactions: {
                    $concatArrays: concatDynamicArrays,
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
            $group: {
                _id: "$_id",
                totalP2pCreditAmount: {
                    $first: { $toDouble: "$totalP2pCreditAmount" },
                },
                totalP2pDebitAmount: {
                    $first: { $toDouble: "$totalP2pDebitAmount" },
                },
                totalP2pCreditLocalAmount: {
                    $first: { $toDouble: "$totalP2pCreditLocalAmount" },
                },
                totalP2pDebitLocalAmount: {
                    $first: { $toDouble: "$totalP2pDebitLocalAmount" },
                },

                // business data
                totalB2cAmount: {
                    $first: { $toDouble: "$totalB2cAmount" },
                },
                totalB2cLocalAmount: {
                    $first: { $toDouble: "$totalB2cLocalAmount" },
                },

                // cashin data
                totalCashinAmount: {
                    $first: { $toDouble: "$totalCashinAmount" },
                },
                totalCashinLocalAmount: {
                    $first: { $toDouble: "$totalCashinLocalAmount" },
                },
                // cashout data
                totalCashoutAmount: {
                    $first: { $toDouble: "$totalCashoutAmount" },
                },
                totalCashoutLocalAmount: {
                    $first: { $toDouble: "$totalCashoutLocalAmount" },
                },
                totalTapiCashoutAmount: {
                    $first: { $toDouble: "$totalTapiCashoutAmount" },
                },
                totalTapiCashoutLocalAmount: {
                    $first: { $toDouble: "$totalTapiCashoutLocalAmount" },
                },
                totalCardAmountCredit: {
                    $first: { $toDouble: "$totalCardAmountCredit" },
                },
                totalCardAmountDebit: {
                    $first: { $toDouble: "$totalCardAmountDebit" },
                },
                totalCardLocalAmountCredit: {
                    $first: { $toDouble: "$totalCardLocalAmountCredit" },
                },
                totalCardLocalAmountDebit: {
                    $first: { $toDouble: "$totalCardLocalAmountDebit" },
                },
                // fee data
                totalFeeAmount: {
                    $first: { $toDouble: "$totalFeeAmount" },
                },
                totalFeeLocalAmount: {
                    $first: { $toDouble: "$totalFeeLocalAmount" },
                },
                transactions: {
                    $push: "$transactions",
                },
            },
        });

        const transactions = await Users.aggregate(aggregationPipeline);
        if (transactions.length < 1) throw new ApiError("Invalid Details", 400, translate("zero_transaction"), true);
        const { transactions: data, totalB2cAmount, totalB2cLocalAmount, totalCardLocalAmount, totalCardAmount, totalCardLocalAmountCredit, totalCardLocalAmountDebit, totalCardAmountCredit, totalCardAmountDebit, totalFeeAmount, totalFeeLocalAmount, totalCashoutLocalAmount, totalTapiCashoutAmount, totalCashoutAmount, totalCashinLocalAmount, totalCashinAmount, totalP2pDebitLocalAmount, totalP2pCreditLocalAmount, totalP2pDebitAmount, totalP2pCreditAmount } = transactions[0];
        const firstTransaction = data[data.length - 1];
        const { transactionType } = firstTransaction;
        let initialBalance = firstTransaction.userLastBalance;
        const totalCashin = Number(totalCashinAmount) + Number(totalP2pCreditAmount) + Number(totalB2cAmount) + Number(totalCardAmountCredit);
        const totalCashout = Number(totalCashoutAmount) + Number(totalP2pDebitAmount) + Number(totalCardAmountDebit) + Number(totalTapiCashoutAmount) + Number(totalFeeAmount);
        if (transactionType === "P2P" || transactionType === "B2C") {
            initialBalance = firstTransaction.type === "credit" ? firstTransaction.receiverLastBalance : firstTransaction.senderLastBalance;
        }
        const currency = CountryCurrencies[countryCode];
        const payload = {
            data,
            currency,
            fullName: `${firstName.toUpperCase()} ${lastName.toUpperCase()}`,
            email,
            balance: convertToRequiredDecimalPlaces(balance, 2),
            initialBalance,
            totalCashin,
            totalCashout,
            date: formatDateRange(startDate, endDate),
            address: userAddress,
        };
        const language = req.headers["accept-language"];
        const eStatment = language === Lenguages.English ? EstatementTemplate(payload) : EstatementTemplateSpanish(payload);
        const uniqueFileName = `E-statement-${startDate}_to_${endDate}.pdf`;
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        filePath = path.join(__dirname, uniqueFileName);

        // convert to pdf
        await convertHtmlToPdf(eStatment, filePath);

        // read the fiel and send it
        const FileData = await fs.readFile(filePath);
        try {
            await sendEmailWithSES(email, translate("e_statment_subject"), translate("e_statment_html"), FileData.toString("base64"), uniqueFileName);
        } catch (err) {
            logger.error(`Error in e-statement email :: ${err.message}`);
            throw new ApiError("Invalid Details", 400, translate("email_send_fail"), true);
        }
        return sendSuccessResponse(res, 200, true, translate("estatment_generate_success"), "E-Statement");
    } catch (error) {
        next(error);
    } finally {
        if (filePath) {
            try {
                await fs.access(filePath, fs.constants.F_OK);
                await fs.unlink(filePath);
            } catch (err) {
                if (err.code === "ENOENT") {
                    logger.warn(`File does not exist at path: ${filePath}`);
                } else {
                    logger.error(`Error deleting file: ${err.message}`);
                }
            }
        }
    }
    return false;
};

export default generateEstatement;
