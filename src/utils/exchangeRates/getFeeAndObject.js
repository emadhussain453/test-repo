import calculateCalculationType from "../calculateCalculationType.js";
import getStableFee from "../getStableFee.js";

async function getFeeAndFeeObject(amount, service, serviceFeature, countryCode) {
    const feeDetails = await getStableFee(service, serviceFeature, countryCode);
    if (!feeDetails?.stableFee || !feeDetails?.serviceFee) {
        return 0;
    }
    const { stableFee, serviceFee } = feeDetails;
    const stableFeeAmount = calculateCalculationType(amount, stableFee.calculationType, stableFee.amount);
    const serviceFeeAmount = calculateCalculationType(amount, serviceFee.calculationType, serviceFee.amount);

    const totalFee = stableFeeAmount + serviceFeeAmount;

    const constructFeeObject = {
        amount: totalFee,
        serviceFeeDetuction: serviceFeeAmount,
        stableFeeDetuction: stableFeeAmount,
        stableFeeWhenCharged: {
            amount: stableFee.amount,
            calculationType: stableFee.calculationType,
        },
        serviceFeeWhenCharged: {
            amount: serviceFee.amount,
            calculationType: serviceFee.calculationType,
        },
    };

    return constructFeeObject;
}

export default getFeeAndFeeObject;
