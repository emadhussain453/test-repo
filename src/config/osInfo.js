import os from "os";
import logger from "../logger/index.js";

export const getOsName = () => os.type();
export const getFreeMemoryPercentage = () => {
    let freeMemory = os.freemem();
    let freeMemInKb = Math.floor(freeMemory / 1024);
    let freeMemInMb = Math.floor(freeMemInKb / 1024);
    const freeMemInGb = Math.floor(freeMemInMb / 1024);

    freeMemInMb %= 1024;
    freeMemInKb %= 1024;
    freeMemory %= 1024;

    const freeMem = `${freeMemInGb}GB ${freeMemInMb}MB ${freeMemInKb}KB and ${freeMemory}Bytes`;

    return freeMem;
};
export const getUptimeInMinutes = () => {
    const d = Number(os.uptime());
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor(d % 3600 % 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
    const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
    const upTimeInDays = (os.uptime() / 60 / 60 / 24).toFixed(2);
    return {
        upTimeInDays,
        upTimeInMinutes: hDisplay + mDisplay + sDisplay,
    };
};

const osInfo = {
    osName: getOsName(),
    freeMemory: getFreeMemoryPercentage(),
    ...getUptimeInMinutes(),
};

logger.info(osInfo);
