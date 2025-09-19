/* eslint-disable no-restricted-syntax */
import { ApiError } from "../ApiError.js";
import calculateCalculationType from "../calculateCalculationType.js";
import convertToRequiredDecimalPlaces from "../convertToRequiredDecimalPlaces.js";
import getStableFeeV1 from "../getStableFeeV1.js";
import getExchangeRate from "./getExchangeRate.js";

async function getFeeAndFeeObjectV1(amount, service, serviceFeature, countryCode) {
    const feeDetails = await getStableFeeV1(service, serviceFeature, countryCode);
    if (!feeDetails?.stableFee || !feeDetails?.serviceFee) {
        return 0;
    }
    const { stableFee, serviceFee, stableCurrency, serviceCurrency } = feeDetails;
    let serviceCalculationAmount = amount;
    let stableCalculationAmount = amount;
    let stableCurrencyExRate;
    let serviceCurrencyExRate;
    if (stableCurrency !== "SUSD") {
        stableCurrencyExRate = await getExchangeRate(stableCurrency);
        if (!stableCurrencyExRate) throw new ApiError("Exchange rate error", 400, "Exchange rate is currently unavailable.", true);
        const exRateToMultiply = serviceFeature === "CASHOUT" ? stableCurrencyExRate.selling : stableCurrencyExRate.buying;
        stableCalculationAmount = convertToRequiredDecimalPlaces((amount * exRateToMultiply));
    }
    if (serviceCurrency !== "SUSD") {
        if (stableCurrency === serviceCurrency) serviceCurrencyExRate = stableCurrencyExRate;
        else {
            serviceCurrencyExRate = await getExchangeRate(serviceCurrency);
            if (!serviceCurrencyExRate) throw new ApiError("Exchange rate error", 400, "Exchange rate is currently unavailable.", true);
        }
        const exRateToMultiply = serviceFeature === "CASHOUT" ? serviceCurrencyExRate.selling : serviceCurrencyExRate.buying;
        serviceCalculationAmount = convertToRequiredDecimalPlaces((amount * exRateToMultiply));
    }
    let totalStableFee = 0;
    let totalServiceFee = 0;
    const appliedStableFees = [];
    const appliedServiceFees = [];
    // Iterate and apply stable fees
    for (const fee of stableFee) {
        const feeAmount = calculateCalculationType(stableCalculationAmount, fee.calculationType, fee.amount);
        totalStableFee += feeAmount;
        appliedStableFees.push({
            name: fee.name,
            amount: fee.amount,
            calculationType: fee.calculationType,
        });
    }
    // Iterate and apply service fees
    for (const fee of serviceFee) {
        const feeAmount = calculateCalculationType(serviceCalculationAmount, fee.calculationType, fee.amount);
        totalServiceFee += feeAmount;
        appliedServiceFees.push({
            name: fee.name,
            amount: fee.amount,
            calculationType: fee.calculationType,
        });
    }
    if (stableCurrency !== "SUSD") {
        const exRateToDivide = serviceFeature === "CASHOUT" ? stableCurrencyExRate.selling : stableCurrencyExRate.buying;
        totalStableFee = convertToRequiredDecimalPlaces(totalStableFee / exRateToDivide, 4);
    }
    if (serviceCurrency !== "SUSD") {
        const exRateToDivide = serviceFeature === "CASHOUT" ? serviceCurrencyExRate.selling : serviceCurrencyExRate.buying;
        totalServiceFee = convertToRequiredDecimalPlaces(totalServiceFee / exRateToDivide, 4);
    }
    const totalFee = totalStableFee + totalServiceFee;

    const constructFeeObject = {
        amount: Number(totalFee.toFixed(4)),
        serviceFeeDetuction: Number(totalServiceFee.toFixed(4)),
        stableFeeDetuction: Number(totalStableFee.toFixed(4)),
        stableFeeWhenCharged: appliedStableFees,
        serviceFeeWhenCharged: appliedServiceFees,
    };

    return constructFeeObject;
}

export default getFeeAndFeeObjectV1;
