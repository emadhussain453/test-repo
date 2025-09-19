import GetD24ExchangeRate from "../exchangeRates/getD24ExchangeRate.js";
import applyCurrencyExchangeRateOnAmount from "../exchangeRates/applyCurrencyExchangeRateOnAmount.js";
import { CountryCurrencies, DirectaCardPaymentMethods, DirectaCountryCodes, DirectaPaymentMethods, ExTypes, StableCurrencies } from "../../constants/index.js";
import StableFees from "../../models/stableFee.js";
import StableExchangeRates from "../../models/exchangeRates.js";
import logger from "../../logger/index.js";
import convertToRequiredDecimalPlaces from "../convertToRequiredDecimalPlaces.js";
import calculateStableFee from "../exchangeRates/calculateStableFee.js";
import calculateDirectaFee from "../exchangeRates/calculateDirectaFee.js";

const getFinalAmountAfterAddmingFee = async (amount, paymentMethod, countryCode, paymentService = "DIRECTA24") => {
    try {
        if (!amount) {
            throw new Error(`Amount is required.`);
        }

        if (!paymentMethod) {
            throw new Error(`Payment method is required.`);
        }

        if (!Object.keys(DirectaCountryCodes).includes(countryCode)) {
            throw new Error(`Country code is not valid.`);
        }

        if (!Object.keys(DirectaPaymentMethods[countryCode]).includes(paymentMethod)) {
            throw new Error(`Payment method is not valid. Only [${Object.keys(DirectaPaymentMethods[countryCode])}] payment methods are allowed.`);
        }

        const cardPaymentMethods = DirectaCardPaymentMethods[countryCode];
        const isCardPayment = cardPaymentMethods.includes(DirectaPaymentMethods[countryCode][paymentMethod]);
        const currency = CountryCurrencies[countryCode];

        const arrayOfPromises = [
            StableExchangeRates.findOne({ currency }),
            GetD24ExchangeRate(countryCode, amount),
            StableFees.findOne({ countryCode, service: paymentService }),
            applyCurrencyExchangeRateOnAmount(amount, StableCurrencies[CountryCurrencies[countryCode]], ExTypes.Buying),
        ];

        const [stableExRate, D24ExRate, stableFee, stableExRateonAmount] = await Promise.all(arrayOfPromises);
        if (!stableExRate) {
            throw new Error(`Stable exchange for  ${countryCode} not found!`);
        }

        if (!stableFee) {
            throw new Error(`Stable fee for  ${countryCode} not found!`);
        }

        const { fx_rate: D24FxRate, converted_amount: D24ConvertedAmount, currency: D24Currency } = D24ExRate;

        // for adding stable fee
        const stableFeeOnAmount = calculateStableFee(amount, stableFee);
        const directaFeeOnAmount = calculateDirectaFee(amount, isCardPayment, stableFee, stableExRate.buying);

        const totalFinalFee = Number(stableFeeOnAmount) + Number(directaFeeOnAmount);
        const finalAmount = convertToRequiredDecimalPlaces((Number(stableExRateonAmount) + totalFinalFee));
        const oneStableCoin = convertToRequiredDecimalPlaces(finalAmount / amount);

        const feePayload = {
            totalFeeDetuction: convertToRequiredDecimalPlaces(totalFinalFee),
            serviceFeeDetuction: convertToRequiredDecimalPlaces(Number(directaFeeOnAmount)),
            stableFeeDetuction: convertToRequiredDecimalPlaces(Number(stableFeeOnAmount)),
            amount,
            D24ExRate: {
                fxRate: D24FxRate,
                convertedAmount: D24ConvertedAmount,
                currency: D24Currency,
            },
            stableExRate: {
                currency: stableExRate.currency,
                buying: stableExRate.buying,
                selling: stableExRate.selling,
                exchangeId: stableExRate._id,
            },
            stableFee: {
                paymentMethodsFee: {
                    pse: {
                        value: stableFee.paymentMethod.pse.value,
                        type: stableFee.paymentMethod.pse.type,
                    },
                    card: {
                        value: stableFee.paymentMethod.card.value,
                        type: stableFee.paymentMethod.card.type,
                    },
                },
            },
            oneStableCoin,
            finalAmount,
        };
        return feePayload;
    } catch (error) {
        throw new Error(error.message);
    }
};

export default getFinalAmountAfterAddmingFee;
