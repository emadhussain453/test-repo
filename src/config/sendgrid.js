import sendGrid from "@sendgrid/mail";
import ENV from "./keys.js";

sendGrid.setApiKey(ENV.SENDGRID.API_SECRET);

const sendEmail = async (email, subject, html, attachmentData, attachmentName, attachmentType = "application/pdf") => {
    try {
        const msg = {
            to: email,
            from: {
                name: "Stable",
                email: ENV.SENDGRID.FROM,
            },
            subject,
            html,
            text: "Hello,",
        };
        if (attachmentData && attachmentName) {
            msg.attachments = [
                {
                    content: attachmentData.toString("base64"),
                    filename: attachmentName,
                    type: attachmentType,
                    disposition: "attachment",
                },
            ];
        }
        if (Array.isArray(email)) {
            return await sendGrid.sendMultiple(msg);
        }
        return await sendGrid.send(msg);
    } catch (err) {
        throw new Error(err);
    }
};

export default sendEmail;
