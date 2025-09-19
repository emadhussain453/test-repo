import setToCache from "./cache/setToCache.js";
import getFromCache from "./cache/getFromCache.js";
import StableFeesV1 from "../models/stableFeeV1.js";

function serializeFeeData(feeData) {
    return {
        service: feeData.service,
        serviceFeature: feeData.serviceFeature,
        countryCode: feeData.countryCode,
        _id: feeData._id,
        stableCurrency: feeData.stableCurrency,
        serviceCurrency: feeData.serviceCurrency,
        createdAt: feeData.createdAt,
        updatedAt: feeData.updatedAt,
        stableFee: feeData.stableFee.map((fee) => ({
            name: fee.name,
            calculationType: fee.calculationType,
            amount: fee.amount.toString(),
        })),
        serviceFee: feeData.serviceFee.map((fee) => ({
            name: fee.name,
            calculationType: fee.calculationType,
            amount: fee.amount.toString(),
        })),
    };
}
async function getStableFeeV1(service = "ONEPAY", serviceFeature = "CASHOUT", countryCode = "COL") {
    const key = `stableFeeV1:${service}-${serviceFeature}-${countryCode}`;
    const feeDetailsfromCache = await getFromCache(key);

    if (feeDetailsfromCache) return feeDetailsfromCache;

    const feeDetails = await StableFeesV1.findOne({ service, serviceFeature, countryCode });

    if (!feeDetails) { throw new Error("Stable fee not available"); }
    const fee = serializeFeeData(feeDetails);
    await setToCache(key, fee);
    return feeDetails;
}

export default getStableFeeV1;
