import { AmountCalculationType } from "../constants/index.js";
import InternalFees from "../models/internalFees.js";
import calculateCalculationType from "./calculateCalculationType.js";
import calculatePercentage from "./calculatePercentageForAmount.js";

async function calculateFee(transactionType, amount) {
    try {
        const feeData = await InternalFees.findOne({ feeType: transactionType });

        if (!feeData) {
            throw new Error("Fee not found.");
        }

        const feeAmount = calculateCalculationType(amount, feeData.calculationType, feeData.amount);
        return { feeId: feeData._id, calculationType: feeData.calculationType, feeAmount, feeAmountWhenCharged: feeData.amount, description: feeData.description };
    } catch (error) {
        throw new Error(error.message);
    }
}

export default calculateFee;
