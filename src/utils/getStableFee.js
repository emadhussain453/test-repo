import setToCache from "./cache/setToCache.js";
import getFromCache from "./cache/getFromCache.js";
import StableFees from "../models/stableFee.js";

async function getStableFee(service = "DIRECTA24", serviceFeature = "CASHOUT", countryCode = "COL") {
    const key = `stableFee:${service}-${serviceFeature}-${countryCode}`;
    const feeDetailsfromCache = await getFromCache(key);
    if (feeDetailsfromCache) return feeDetailsfromCache;

    const feeDetails = await StableFees.findOne({ service, serviceFeature, countryCode });

    if (!feeDetails) { throw new Error("Stable fee not available"); }
    await setToCache(key, feeDetails);
    return feeDetails;
}

export default getStableFee;
