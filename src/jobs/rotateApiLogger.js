import cron from "node-cron";
import print from "../utils/print.js";
import truncateLogFiles from "../utils/logger/truncateLogFiles.js";

const jobs = cron.schedule("0 2 * * *", async () => {
    // 0 0 * * * --> every day at 00:00
    // 0 2 * * * --> every day at 02:00
    const arrayOfFilesToTruncate = ["logs/api-log.log", "logs/fatal.log", "logs/error.log"];
    const p = [];
    for (let i = 0; i < arrayOfFilesToTruncate.length; i++) {
        p.push(truncateLogFiles(arrayOfFilesToTruncate[i]));
    }
    await Promise.all(p);
});

export default jobs;
