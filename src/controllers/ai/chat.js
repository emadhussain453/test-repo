import { OpenAI } from "openai";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import ENV from "../../config/keys.js";
import Event from "../../Events/databaseLogs.js";
import { EventTypes } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";

const chatWithAi = async (req, res, next) => {
    try {
        const { msg } = req.body;
        const userIpAddress = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip;
        const userTempDeviceId = req.headers["x-temp-id"];

        if (!msg) throw new ApiError("Invalid Cradentials", 400, "Please provide a message", true);

        let completedRun;
        const openai = new OpenAI({
            apiKey: ENV.OPENAI.API_KEY,
        });
        const thread = await openai.beta.threads.create({
            messages: [
                { role: "user", content: msg },
            ],
        });

        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: ENV.OPENAI.ASSISTANT_ID,
        });

        do {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => { setTimeout(resolve, 1000); });
            // eslint-disable-next-line no-await-in-loop
            completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        } while (completedRun.status !== "completed");

        const { data: [{ content: [{ text: { value: last } }] }] } = await openai.beta.threads.messages.list(thread.id);

        const eventData = {
            question: msg,
            answer: last,
        };

        if (userTempDeviceId) eventData.userTempDeviceId = userTempDeviceId;
        if (userIpAddress) eventData.userIpAddress = userIpAddress;

        const ans = {
            answer: last,
        };

        Event.emit(EventTypes.OpenAILogs, eventData);
        return sendSuccessResponse(res, 200, true, "Answer From AI", "chatWithAi", ans);
    } catch (error) {
        next(error);
    }
    return false;
};

export default chatWithAi;
