import convertToRequiredDecimalPlaces from "./convertToRequiredDecimalPlaces.js";

function calculateOneStableCoin(localCurrency, exchangeRate) {
    return convertToRequiredDecimalPlaces(localCurrency / exchangeRate);
}

export default calculateOneStableCoin;
