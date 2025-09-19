import fs from "fs";
import Event from "../../Events/databaseLogs.js";
import { EventTypes } from "../../constants/index.js";
import print from "../print.js";

// Create a response middleware function
const logResponse = (response) => {
    const obj = {
        type: "Response",
        date: new Date().toISOString(),
        method: response.method,
        url: response.url,
        data: response.data,
    };

    let log = JSON.stringify(obj);
    log += "\n"; // Add a new line to the end of the log
    Event.emit(EventTypes.backEndLogs, obj);
    const writeStream = fs.createWriteStream("logs/api-log.log", { flags: "a" });
    writeStream.write(log);
    writeStream.end();
    writeStream.on("finish", () => {
        print("info", "Response log write completed");
    });

    return response;
};

export default logResponse;
