import fs from "fs";
import print from "../print.js";

const truncateLogFiles = (fileLocation) => new Promise((resolved, rejected) => {
    fs.stat(fileLocation, (err /* stats*/) => {
        if (err) {
            rejected(err.message);
        }
        // if (stats.size > 1000000) {
        fs.truncate(fileLocation, 0, () => {
            print("info", `${fileLocation} file truncated`);
            resolved("Log file truncated");
        });
        // }
    });
});

export default truncateLogFiles;
