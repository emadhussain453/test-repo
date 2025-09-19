import mongoose from "mongoose";
import StableFees from "../models/stableFee.js";
import FeatureStatus from "../models/featureStatus.js";
import { AmountCalculationType, CountryCurrencies, FeatureNames, FlagsWithColor, StableActiveCountryCodes, StableServicesFeatures, StableThirdpartyServices } from "../constants/index.js";
import ExchangeRates from "../models/exchangeRates.js";
import AutoExchanges from "../models/autoExchange.js";
import D24Banks from "../models/d24Banks.js";
import Wallet from "../models/feeWallet.js";
import AppConfig from "../models/appConfig.js";
import ScoreRule from "../models/scoreRules.js";

// app config
const appConfigObject = {
    cashin: {
        minLimit: 25,
        maxLimit: 100,
        verificationRequiredLimit: 1400,
        checkDays: 30,
    },
    cashout: {
        minLimit: 25,
        maxLimit: 100,
    },
    flag: FlagsWithColor.ORANGE,
    maintenance: {
        isScheduled: false,
        description: {
            en: "Default description",
            es: "Descripción predeterminada",
        },
    },
};
// Default fee model data
const defaultCashoutFeeModel = {
    stableFee: {
        amount: 0.0000,
        calculationType: AmountCalculationType.PERCENTAGE,
    },
    serviceFeature: StableServicesFeatures.DIRECTA24.CASHOUT,
    countryCode: StableActiveCountryCodes.COL,
    serviceFee: {
        amount: 0.0000,
        calculationType: AmountCalculationType.PERCENTAGE,
    },
};
const defaultFinixFeeModel = {
    stableFee: {
        amount: 0.0000,
        calculationType: AmountCalculationType.PERCENTAGE,
    },
    serviceFeature: StableServicesFeatures.DIRECTA24.CASHIN,
    countryCode: StableActiveCountryCodes.USA,
    serviceFee: {
        amount: 0.0000,
        calculationType: AmountCalculationType.PERCENTAGE,
    },
};
const defaultCashoutFeeModel2 = {
    stableFee: {
        amount: 0.0000,
        calculationType: AmountCalculationType.PERCENTAGE,
    },
    serviceFeature: StableServicesFeatures.DIRECTA24.CASHIN,
    countryCode: StableActiveCountryCodes.COL,
    paymentMethod: {
        cash: {
            amount: 0.0000,
            calculationType: AmountCalculationType.FLAT,
        },
        card: {
            amount: 0.0000,
            calculationType: AmountCalculationType.PERCENTAGE,
        },
    },
};
const serviceFeaturesStatuses = [
    {
        featureName: FeatureNames.cashin,
        status: true,
    },
    {
        featureName: FeatureNames.cashout,
        status: true,
    },
    {
        featureName: FeatureNames.p2p,
        status: true,
    },
    {
        featureName: FeatureNames.card,
        status: true,
    },
];

const defaultScoreRule = {
    // Positive Actions
    kyc: 25,
    cashinTransactions: 5,
    cardTransaction: 5,
    firstCashin: 10,
    orderPhysicalCard: 5,
    orderVirtualCard: 5,
    activatePhysicalCard: 10,
    keepBalance: 5,
    recharge: 5,
    subscription: 5,
    payBill: 5,
    documentVerification: 10,
    resetSoftBlock: 10,

    // Suspicious Behavior Deductions
    failedTxn: -10,
    cashinOutSame: -15,
    multiIp: -10,
    multiDevices: -5,
    funsTransferToSuspiciousUser: -10,
};

async function prefillDatabase() {
    try {
        // Insert the default fee model data when the server starts
        const findCashoutStableFee = await StableFees.findOne({ service: StableThirdpartyServices.DIRECTA24, serviceFeature: StableServicesFeatures.DIRECTA24.CASHOUT, countryCode: StableActiveCountryCodes.COL });
        if (!findCashoutStableFee) {
            await StableFees.findOneAndUpdate({ service: StableThirdpartyServices.DIRECTA24, serviceFeature: StableServicesFeatures.DIRECTA24.CASHOUT }, defaultCashoutFeeModel, { upsert: true, new: true });
        }
        const findCashoutStableFee2 = await StableFees.findOne({ service: StableThirdpartyServices.DIRECTA24, serviceFeature: StableServicesFeatures.DIRECTA24.CASHIN, countryCode: StableActiveCountryCodes.COL });
        if (!findCashoutStableFee2) {
            await StableFees.findOneAndUpdate({ service: StableThirdpartyServices.DIRECTA24, serviceFeature: StableServicesFeatures.DIRECTA24.CASHIN }, defaultCashoutFeeModel2, { upsert: true, new: true });
        }
        const areFeatureStatusesInserted = await FeatureStatus.findOne({});
        if (!areFeatureStatusesInserted) {
            await FeatureStatus.insertMany(serviceFeaturesStatuses, { upsert: true, new: true });
        }
        // FINIX
        const findFinixFee = await StableFees.findOne({ service: StableThirdpartyServices.FINIX, serviceFeature: StableServicesFeatures.DIRECTA24.CASHIN, countryCode: StableActiveCountryCodes.USA });
        if (!findFinixFee) {
            await StableFees.findOneAndUpdate({ service: StableThirdpartyServices.FINIX, serviceFeature: StableServicesFeatures.DIRECTA24.CASHIN }, defaultFinixFeeModel, { upsert: true, new: true });
        }

        // add iframe tag in banks
        await D24Banks.updateMany({ feature: StableServicesFeatures.DIRECTA24.CASHIN.toLowerCase(), bankCode: { $ne: "ONEPAY" } }, { $set: { tag: "iframe" } });

        // AUTO_EXCHANGE
        const exchangeRates = await ExchangeRates.findOne({ currency: CountryCurrencies.COL });
        const autoExchangeForCurreny = await AutoExchanges.findOne({ currencyId: exchangeRates._id });
        if (!autoExchangeForCurreny) {
            await AutoExchanges.create({ currencyId: exchangeRates._id });
        }
        // create wallet if not available
        const walletExists = await Wallet.findOne({});
        if (!walletExists) {
            await Wallet.create({ balance: 0 });
        }
        const appConfig = await AppConfig.findOne({});
        if (!appConfig) {
            await AppConfig.create(appConfigObject);
        } else {
            const { cashin: { verificationRequiredLimit, checkDays } } = appConfig;
            if (!verificationRequiredLimit || !checkDays) await AppConfig.updateOne({}, { $set: { "cashin.verificationRequiredLimit": 1400, "cashin.checkDays": 30 } });
        }
        // scoreRules
        const scoreRules = await ScoreRule.findOne({});
        if (!scoreRules) {
            await ScoreRule.insertOne(defaultScoreRule);
        }
    } catch (err) {
        console.error("Error prefilling the database:", err);
    }
}

export default prefillDatabase;
