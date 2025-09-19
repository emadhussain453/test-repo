import { OpenAI } from "openai";
import ENV from "../../config/keys.js";

const chatWithAi = async (msg) => {
    try {
        const assistantIds = [ENV.OPENAI.ASSISTANT_ID, ENV.OPENAI.ASSISTANT_ID_2];
        let completedRun;
        const openai = new OpenAI({
            apiKey: ENV.OPENAI.API_KEY,
        });

        const getResponseFromAssistant = async (assistantId) => {
            const thread = await openai.beta.threads.create({
                messages: [
                    { role: "user", content: msg },
                ],
            });

            const run = await openai.beta.threads.runs.create(thread.id, {
                assistant_id: assistantId,
            });

            do {
                // eslint-disable-next-line no-await-in-loop
                await new Promise((resolve) => { setTimeout(resolve, 1000); });
                // eslint-disable-next-line no-await-in-loop
                completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
            } while (completedRun.status !== "completed");

            const { data: [{ content: [{ text: { value: last } }] }] } = await openai.beta.threads.messages.list(thread.id);
            return last.replace(/^"|"$/g, "");
        };

        const responses = await Promise.all(assistantIds.map((id) => getResponseFromAssistant(id)));

        const ans = {
            answer: responses[1] === "issue" ? "Nuestro equipo de soporte se pondrá en contacto contigo pronto." : responses[0],
        };

        return { success: true, message: ans.answer };
    } catch (error) {
        return { success: false, error };
    }
};

export default chatWithAi;
