import fs from "fs";
import Event from "../../Events/databaseLogs.js";
import { EventTypes } from "../../constants/index.js";

import print from "../print.js";

const logRequest = (request) => {
    const obj = {
        type: "Request",
        date: new Date().toISOString(),
        method: request.method,
        url: request.url,
        headers: request.headers,
        data: request.data,
    };

    let log = JSON.stringify(obj);
    log += "\n"; // Add a new line to the end of the log
    Event.emit(EventTypes.backEndLogs, obj);
    const writeStream = fs.createWriteStream("logs/api-log.log", { flags: "a" });
    writeStream.write(log);
    writeStream.end();
    writeStream.on("finish", () => {
        print("info", "Request log write completed");
    });

    return request;
};

export default logRequest;
