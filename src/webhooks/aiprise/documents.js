/* eslint-disable comma-dangle */
import crypto from "crypto";
import logger from "../../logger/index.js";
import Users from "../../models/users.js";
import { AiPriseKycStatus, Status, AppEnviornments } from "../../constants/index.js";
import keys from "../../config/keys.js";

async function documentWebhook(req, res, next) {
    try {
        const { body, headers } = req;
        const bodyAsString = req?.payloadAsString ?? JSON.stringify(body);
        logger.info(`in document webhook  ::  ${bodyAsString}`);
        const apiKey = keys.AiPraise.API_KEY;
        const hashVal = crypto
            .createHmac("sha256", apiKey)
            .update(Buffer.from(bodyAsString, "utf8"))
            .digest("hex")
            .toLowerCase();

        if (hashVal !== headers["x-hmac-signature"] && process.env.NODE_ENV === AppEnviornments.PRODUCTION) {
            logger.error("BAD AUTHENTICATION");
            logger.error({ hashVal, incommingHash: headers["x-hmac-signature"], payloadAsString: req.payloadAsString });
            return res.status(401).json({
                status: 401,
                message: "Unauthorized"
            });
        }

        const { verification_session_id: vSi, verification_result: vR, user_profile_event_type: eventType } = body;

        const user = await Users.findOne({ "aiPriseAdditionalDocument.verificationSessionId": vSi }).select("language bankStatementVerification aiPriseAdditionalDocument firstName lastName devices email");
        if (!user) {
            return res.status(400).json({
                status: 400,
                message: "Invalid client refrance id",
            });
        }

        // update kyc status as we recieve events
        if (eventType !== "RELATED_CASE_STATUS_UPDATE") {
            return res.status(200).json({
                status: 200,
                message: "Invalid aipraise event",
            });
        }

        const { _id: userId, email, bankStatementVerification, aiPriseAdditionalDocument: { status: aiPriseStatus, fileId } } = user;

        if (aiPriseStatus === AiPriseKycStatus.APPROVED && bankStatementVerification === true) {
            logger.info(`User :: ${email} document has already verified`);
            return res.status(200).json({
                status: 200,
            });
        }

        const ApprovedStatus = [AiPriseKycStatus.APPROVED, AiPriseKycStatus.REVIEW];
        if (!ApprovedStatus.includes(vR)) {
            await Users.updateOne({ _id: userId }, {
                $set: {
                    "aiPriseAdditionalDocument.verificationSessionId": vSi,
                    "aiPriseAdditionalDocument.status": vR,
                    fileId,
                }
            });
            return res.status(200).json({
                status: 200,
            });
        }

        const aiPriseAdditionalDocument = {
            verificationSessionId: vSi,
            status: vR,
            stableStatus: Status.PENDING,
            fileId,
        };
        const userUpdateQuery = {
            $set: {
                aiPriseAdditionalDocument,
            },
        };

        await Users.updateOne({ _id: userId }, userUpdateQuery);
        return res.status(200).json({ message: "Kyc completed successfully." });
    } catch (error) {
        next(error);
    }
    return true;
}
export default documentWebhook;
