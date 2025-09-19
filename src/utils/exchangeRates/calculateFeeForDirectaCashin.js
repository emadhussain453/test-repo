import calculateCalculationType from "../calculateCalculationType.js";
import getStableFee from "../getStableFee.js";

function calculateCashinPaymentMethodFee(amount, paymentMethods, isCardPayment) {
    let serviceFeeAmount = 0;
    let serviceFeeWhenCharged = {};
    const { card, cash } = paymentMethods || {};
    if (isCardPayment) {
        const { amount: cardFeeAmount, calculationType } = card;
        const cardObject = {
            paymentMethodType: "card",
            amount: cardFeeAmount,
            calculationType,
        };
        serviceFeeWhenCharged = cardObject;
        serviceFeeAmount = calculateCalculationType(amount, calculationType, cardFeeAmount);
    } else {
        const { amount: cashFeeAmount, calculationType } = cash;
        const cashObject = {
            paymentMethodType: "cash",
            amount: cashFeeAmount,
            calculationType,
        };
        serviceFeeWhenCharged = cashObject;
        serviceFeeAmount = calculateCalculationType(amount, calculationType, cashFeeAmount);
    }
    return {
        serviceFeeAmount,
        serviceFeeWhenCharged,
    };
}

async function getFeeObjectForCashin(amount, service, serviceFeature, countryCode, isCardPayment = false) {
    const feeDetails = await getStableFee(service, serviceFeature, countryCode);
    if (!feeDetails?.stableFee || !feeDetails?.paymentMethod) {
        return 0;
    }
    const { stableFee, paymentMethod } = feeDetails;
    const stableFeeAmount = calculateCalculationType(amount, stableFee.calculationType, stableFee.amount);
    const { serviceFeeAmount, serviceFeeWhenCharged } = calculateCashinPaymentMethodFee(amount, paymentMethod, isCardPayment);

    const stableFeeWhenCharged = {
        amount: stableFee.amount,
        calculationType: stableFee.calculationType,
    };
    const totalFee = stableFeeAmount + serviceFeeAmount;

    const constructFeeObject = {
        amount: totalFee,
        serviceFeeDetuction: serviceFeeAmount,
        stableFeeDetuction: stableFeeAmount,
        stableFeeWhenCharged,
        serviceFeeWhenCharged,
    };
    return constructFeeObject;
}

export default getFeeObjectForCashin;
