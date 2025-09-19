/* eslint-disable import/no-extraneous-dependencies */
import { SESClient, SendEmailCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { AwsSESConnectionObect } from "../constants/index.js";
import logger from "../logger/index.js";
import ENV from "./keys.js";

const SESConfig = new SESClient(AwsSESConnectionObect);

function createRawEmail(recipient, subject, html, attachment, attachmentName) {
    const boundary = "NextPart";
    const header = `From: Stable <${ENV.AWS.EMAIL}>\n`
        + `To: ${recipient}\n`
        + `Subject: ${subject}\n`
        + "MIME-Version: 1.0\n"
        + `Content-Type: multipart/mixed; boundary="${boundary}"\n\n`;

    const body = `--${boundary}\n`
        + "Content-Type: text/html; charset=us-ascii\n\n"
        + `${html}\n\n`
        + `--${boundary}\n`
        + "Content-Type: application/pdf;\n"
        + `Content-Disposition: attachment; filename="${attachmentName}"\n`
        + "Content-Transfer-Encoding: base64\r\n\r\n"
        + `${attachment}\n\n`
        + `--${boundary}--`;

    return header + body;
}
const sendEmailWithSES = async (email, subject, html, attachmentData, attachmentName) => {
    // if file contain attachment
    if (attachmentData && attachmentName) {
        const rawEmail = createRawEmail(email, subject, html, attachmentData, attachmentName);
        const rawParams = {
            RawMessage: {
                Data: Buffer.from(rawEmail),
            },
            Source: ENV.AWS.EMAIL,
            Destinations: [email],
        };
        const emailCommand = new SendRawEmailCommand(rawParams);
        const res = await SESConfig.send(emailCommand);
        return res;
    }

    const params = {
        Destination: Array.isArray(email)
            ? { BccAddresses: email }
            : { ToAddresses: [email] },
        Message: {
            Body: {
                Html: {
                    Data: html,
                },
            },
            Subject: {
                Data: subject,
            },
        },
        Source: `Stable <${ENV.AWS.EMAIL}>`,
    };
    try {
        const emailCommand = new SendEmailCommand(params);
        const res = await SESConfig.send(emailCommand);
        return res;
    } catch (error) {
        logger.error(`SES email error :: ${error.message}`);
        throw new Error(error);
    }
};

export default sendEmailWithSES;
