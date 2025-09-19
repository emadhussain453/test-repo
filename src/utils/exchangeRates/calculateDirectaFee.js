import calculatePercentage from "../calculatePercentageForAmount.js";

const calculateDirectaFee = (amount, isCardPayment, stableFee, stableExRateForCurrency, multiplyWithExRate = true) => {
    let directaFeeOnAmount = 0;
    if (isCardPayment) {
        const totalAmount = multiplyWithExRate ? amount * stableExRateForCurrency : amount; // becoz when we are converting COP to SUSD we dont want the product rather we want the percentage on amount diectly
        const directa24Fee = calculatePercentage(stableFee.paymentMethod.card.value, totalAmount);
        directaFeeOnAmount += directa24Fee;
    } else {
        const directa24Fee = stableExRateForCurrency * stableFee.paymentMethod.pse.value;
        directaFeeOnAmount += directa24Fee;
    }
    return directaFeeOnAmount;
};
export default calculateDirectaFee;
