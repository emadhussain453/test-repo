import calculatePercentage from "../calculatePercentageForAmount.js";

const calculateStableFee = (amount, stableFee, stableExRate, multiplyWithExRate = true) => {
    let stableFeeOnAmount = 0;
    if (stableFee.isPercentageFeeSelected) {
        const calculateTotalAmountUsingStableExRate = multiplyWithExRate ? amount * stableExRate : amount; // will give me totalAMount to calculate percentage on
        const finalStableFee = calculatePercentage(stableFee.percentageFee, calculateTotalAmountUsingStableExRate); // calculating fe -> 1.8% of totalAmount calculated above
        stableFeeOnAmount += finalStableFee;
    } else {
        const calulateFlatFeeUsingStableExRate = stableFee.flatFee * stableExRate;// will give me 0.2 of exchage rate like 0.2 of 4400 = 880
        stableFeeOnAmount += calulateFlatFeeUsingStableExRate;
    }
    return stableFeeOnAmount;
};

export default calculateStableFee;
