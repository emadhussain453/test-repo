import SEND_SANITIZED_SUCCESS_RESPONSE from "../../utils/responses/sendSanitizedSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import callApi from "../../utils/callApi.js";
import keys from "../../config/keys.js";

const CreateAiPriseProfile = async (req, res, next) => {
    try {
        const { user, translate } = req;
        const { _id, firstName, lastName, dateOfBirth, email, phoneNumber, aiPraise: { profileId: aiPriseProfile } } = user;
        if (aiPriseProfile) throw new ApiError("Invalid Credentials", 400, translate("profile_already_created"), true);
        const aiPrisePayload = {
            first_name: firstName,
            last_name: lastName,
            client_reference_id: _id,
            date_of_birth: dateOfBirth,
            email_address: email,
            phone_number: phoneNumber,
            events_callback_url: keys.AiPraise.CALLBACK_URL,
        };

        const result = await callApi.AiPrise("aiPrise", "createUserProfile", "post", aiPrisePayload, false);
        if (!result.success) throw new ApiError("Error in AiPrise Api", 400, translate("3P_api_error", { message: result.message }), true);
        const { user_profile_id: profileId } = result.results;
        user.aiPraise.profileId = profileId;
        await user.save();
        const sanitizedUser = SEND_SANITIZED_SUCCESS_RESPONSE(user);
        return sendSuccessResponse(res, 200, true, translate("user_profile_create_success"), "aiPriseProfile", sanitizedUser);
    } catch (error) {
        next(error);
    }
    return false;
};

export default CreateAiPriseProfile;
