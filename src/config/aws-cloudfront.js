import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import KEYS from "./keys.js";

const awsCradentials = {
    region: KEYS.AWS.REGION,
    credentials: {
        accessKeyId: KEYS.AWS.ACCESS_KEY_ID,
        secretAccessKey: KEYS.AWS.SECRET_ACCESS_KEY,
    },
};
const cloudfront = new CloudFrontClient(awsCradentials);

export default cloudfront;
export { CreateInvalidationCommand };
