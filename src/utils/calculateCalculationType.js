import { AmountCalculationType } from "../constants/index.js";
import calculatePercentage from "./calculatePercentageForAmount.js";

function calculateCalculationType(amount, calculationType, calculationAmount) {
    let feeAmount = 0;
    if (calculationType === AmountCalculationType.PERCENTAGE) {
        feeAmount = calculatePercentage(calculationAmount, amount);
    }
    if (calculationType === AmountCalculationType.FLAT) {
        feeAmount = calculationAmount;
    }
    return Number(feeAmount);
}

export default calculateCalculationType;
