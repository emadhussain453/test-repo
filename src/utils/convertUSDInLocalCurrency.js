import convertToRequiredDecimalPlaces from "./convertToRequiredDecimalPlaces.js";

function covertFeeUSDInLocalCurrency(amount, stableFeeDetuction, serviceFeeDetuction, exchangeRate) {
    const amountInLocalCurrency = convertToRequiredDecimalPlaces(amount * exchangeRate);
    const serviceFeeDetuctionInLocalCurrency = convertToRequiredDecimalPlaces(serviceFeeDetuction * exchangeRate);
    const stableFeeDetuctionInLocalCurrency = convertToRequiredDecimalPlaces(stableFeeDetuction * exchangeRate);
    const localCurrencyFeeDetails = {
        localAmount: amountInLocalCurrency,
        serviceFeeDetuctionLocal: serviceFeeDetuctionInLocalCurrency,
        stableFeeDetuctionLocal: stableFeeDetuctionInLocalCurrency,
    };
    return localCurrencyFeeDetails;
}

export default covertFeeUSDInLocalCurrency;
