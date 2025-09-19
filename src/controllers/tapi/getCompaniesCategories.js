import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import SubscriptionsTapi from "../../models/subscriptions.js";
import Category from "../../models/tapiCategories.js";
import { ApiError } from "../../utils/ApiError.js";
import getExchangeRate from "../../utils/exchangeRates/getExchangeRate.js";
import { StableCurrencies, StableThirdpartyServices } from "../../constants/index.js";
import netacticaStableFee from "../../utils/netacticaStableFee.js";
import applyStableExchangeRateOnTapiSubscriptionOnAmountV2 from "../../utils/applyStableExchangeRateOnTapiServiceOnAmount.js";

async function getCompaniesCategories(req, res, next) {
    try {
        const { query: { pageNumber = 1, pageSize = 10, searchCompany, categoryId, category } } = req;
        const { t: translate } = req;
        const Query = {};

        if (categoryId) {
            const matchingCategory = await Category.findOne({ _id: categoryId }).lean();

            if (!matchingCategory) {
            throw new ApiError("No Categories Found", 400, translate("no_categories_found"), true);
            }

            Query._id = { $in: matchingCategory.companies || [] };
        } else if (category === "other") {
            // Handle the "other" category case
            const aggregation = [
                {
                    $unwind: {
                        path: "$companies",
                    },
                },
                {
                    $lookup: {
                        from: "tapi_subscriptions",
                        localField: "companies",
                        foreignField: "_id",
                        as: "companyDesc",
                    },
                },
                {
                    $project: {
                        companyDetails: {
                            $arrayElemAt: ["$companyDesc", 0],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        companyIds: {
                            $push: "$companyDetails._id",
                        },
                    },
                },
            ];

            const getCompanyIds = await Category.aggregate(aggregation);
            const [dbCompanies] = getCompanyIds;
            Query._id = { $nin: dbCompanies?.companyIds ?? [] };
        }

        if (searchCompany) {
            Query.companyName = { $regex: searchCompany, $options: "i" };
        }
        const totalCount = await SubscriptionsTapi.countDocuments(Query);
        const results = await SubscriptionsTapi.find(Query).skip((pageNumber - 1) * pageSize).limit(pageSize).lean();

          // Fetch exchange rate, fees, and apply fees to the results
          const [exRates, stableFees] = await Promise.all([
            getExchangeRate(StableCurrencies.COP),
            netacticaStableFee(StableThirdpartyServices.TAPI),
        ]);

        if (!exRates) throw new ApiError("Exchange rate error", 400, translate("exchange_rate_unavailable"), true, "EXCHANGE_RATE_ERROR");
        if (!stableFees) throw new ApiError("Exchange rate error", 400, translate("exchange_rate_unavailable"), true, "EXCHANGE_RATE_ERROR");

        const updatedResults = applyStableExchangeRateOnTapiSubscriptionOnAmountV2(
            results,
            stableFees.stableFee,
            stableFees.serviceFee,
            exRates.selling,
            StableCurrencies.COP,
        );
        const finalPayload = {
            totalCount,
            results: updatedResults,
        };
        return sendSuccessResponse(res, 200, true, "success", "getSubscriptionCompanies", finalPayload);
    } catch (error) {
        next(error);
    }
    return false;
}

export default getCompaniesCategories;
