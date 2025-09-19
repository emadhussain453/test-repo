import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import KEYS from "./keys.js";

const awsCradentials = {
    region: KEYS.AWS.REGION,
    credentials: {
        accessKeyId: KEYS.AWS.ACCESS_KEY_ID,
        secretAccessKey: KEYS.AWS.SECRET_ACCESS_KEY,
    },
};
const s3Client = new S3Client(awsCradentials);

export default s3Client;
export { GetObjectCommand };
