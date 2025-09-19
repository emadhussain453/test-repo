import { Readable } from "stream";
import FormData from "form-data";
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import keys from "../../config/keys.js";
import { Status } from "../../constants/index.js";

async function UploadDocument(req, res, next) {
    try {
        const { user, translate } = req;
        const { file } = req;
        const { _id, bankStatementVerification, isBankStatementUploaded, aiPraise: { profileId } } = user;
        if (bankStatementVerification) throw new ApiError("Invalid Credentials", 400, translate("already_verified_document"), true);
        if (isBankStatementUploaded) throw new ApiError("Invalid Credentials", 400, translate("pending_documents_approval"), true);
        if (!file) throw new ApiError("Invalid Credentials", 400, translate("file_required"), true);
        if (!profileId) throw new ApiError("Invalid Credentials", 400, translate("profileId_not_found"), true);
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);
        // Construct FormData
        const formData = new FormData();
        formData.append("user_profile_id", profileId);
        formData.append("file_name", req.file.originalname);
        formData.append("file_type", "BANK_STATEMENT_DOCUMENT");
        formData.append("file", bufferStream, { filename: req.file.originalname });

        const result = await callApi.AiPrise("aiPrise", "addUserDocument", "post", formData, false, formData.getHeaders());
        if (!result.success) throw new ApiError("Error in AiPrise Api", 400, translate("3P_api_error", { message: result.message }), true);
        const { file_uuid: aiPriseFileId } = result.results;
        const verificationPayload = {
            file_uuid: aiPriseFileId,
            user_profile_id: profileId,
            template_id: keys.AiPraise.DOCUMENT_TEMPLATE_ID,
        };
        const runDocumentResult = await callApi.AiPrise("aiPrise", "runCheckUserDocuments", "post", verificationPayload, false);
        if (!runDocumentResult.success) throw new ApiError("Error in AiPrise Api", 400, translate("3P_api_error", { message: runDocumentResult.message }), true);

        const { aiprise_summary: aiSummery, verification_session_id: verificationSessionId } = runDocumentResult.results;
        const { verification_result: vR } = aiSummery;

        const aiPriseAdditionalDocument = {
            verificationSessionId,
            fileId: aiPriseFileId,
            stableStatus: Status.PENDING,
            status: vR,
        };
        const updateQuery = {
            $set: { aiPriseAdditionalDocument, isBankStatementUploaded: true },
        };

        const updated = await Users.updateOne({ _id }, updateQuery);
        if (!updated.modifiedCount) {
            throw new ApiError("Invalid Details", 400, translate("something_went_wrong"), true);
        }
        return sendSuccessResponse(res, 200, true, translate("upload_documents_success"), "upload documents");
    } catch (error) {
        next(error);
    }
}
export default UploadDocument;
