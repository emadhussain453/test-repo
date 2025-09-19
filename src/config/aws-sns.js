import { SNSClient } from "@aws-sdk/client-sns";
import KEYS from "./keys.js";

const AwsSnsCredentialsObject = {
    credentials: {
        accessKeyId: KEYS.AWS.SNS_ACCESS_KEY,
        secretAccessKey: KEYS.AWS.SNS_SECRET_KEY,
    },
    region: KEYS.AWS.REGION,
};

const snsClient = new SNSClient(AwsSnsCredentialsObject);
export default snsClient;
