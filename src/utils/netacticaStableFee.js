import { ExpirySeconds } from "../constants/index.js";
import StableFees from "../models/stableFee.js";
import getFromCache from "./cache/getFromCache.js";
import setToCache from "./cache/setToCache.js";

async function netacticaStableFee(service) {
    try {
        const key = `netactica-stableFee-${service}`;
        const stableFeeFromCache = await getFromCache(key);
        if (stableFeeFromCache) return stableFeeFromCache;
        const stableFeeFromService = await StableFees.findOne({ service });
        if (!stableFeeFromService) throw new Error("Stable Fee not found");
        await setToCache(key, stableFeeFromService, ExpirySeconds.m15);
        return stableFeeFromService;
    } catch (error) {
        return error;
    }
}
export default netacticaStableFee;
