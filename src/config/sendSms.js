import { PublishCommand } from "@aws-sdk/client-sns";
import logger from "../logger/index.js";
import snsClient from "./aws-sns.js";

async function sendSms(PhoneNumber, Message) {
    try {
        const params = {
            PhoneNumber,
            Message,
            MessageAttributes: {
                "AWS.SNS.SMS.SMSType": {
                    DataType: "String",
                    StringValue: "Transactional",
                },
            },
        };
        const command = new PublishCommand(params);
        const response = await snsClient.send(command);
        return response;
    } catch (error) {
        logger.error(`error sms :: ${error.message}`);
        throw new Error(error);
    }
}

export default sendSms;
