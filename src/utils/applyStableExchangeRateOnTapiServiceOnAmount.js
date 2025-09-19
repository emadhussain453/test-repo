import { StableCurrencies } from "../constants/index.js";
import calculateCalculationType from "./calculateCalculationType.js";

function applyStableExchangeRateOnTapiSubscriptionOnAmountV2(results, stableFee, serviceFee, excRates = 1, currencyType = StableCurrencies.SUSD) {
    const updatedResults = results.map((subscription) => {
        const subscriptions = subscription.products.map((product) => {
            const currentAmount = product.amount / excRates;
            const stableFeeAmount = calculateCalculationType(currentAmount, stableFee.calculationType, stableFee.amount);
            const serviceFeeAmount = calculateCalculationType(currentAmount, serviceFee.calculationType, serviceFee.amount);
            let totalFeeInLocal;
            const totalFeeInSUSD = stableFeeAmount + serviceFeeAmount;
            if (currencyType !== StableCurrencies.SUSD) {
                totalFeeInLocal = totalFeeInSUSD * excRates;
            }
            return {
                productId: product.productId,
                productType: product.productType,
                productDescription: product.productDescription,
                productLogo: product.productLogo,
                active: product.active,
                amountInLocal: product.amount,
                totalAmountInSUSD: currentAmount,
                totalFeeInSUSD,
                totalFeeInLocal,
                stableFeeAmount,
                serviceFeeAmount,
            };
        });
        return {
            ...subscription,
            products: subscriptions,
        };
    });
    updatedResults.page = results.page;
    updatedResults.limit = results.limit;
    updatedResults.records = results.records;
    updatedResults.links = results.links;
    updatedResults.tx = results.tx;
    updatedResults.mainTx = results.mainTx;
    return updatedResults;
}

export default applyStableExchangeRateOnTapiSubscriptionOnAmountV2;
