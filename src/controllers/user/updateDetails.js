import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Users from "../../models/users.js";
import getAge from "../../utils/getAge.js";
import deleteFromCache from "../../utils/cache/deleteFromCache.js";

const updateDetails = async (req, res, next) => {
    try {
        const userRequestData = {
            ...req.body,
        };
        const { user, translate } = req;
        if (!userRequestData.email && !userRequestData.phoneNumber && !userRequestData.firstName && !userRequestData.lastName && !userRequestData.dateOfBirth) {
            throw new ApiError("Invalid", 400, translate("at_least_one_field_required"), true);
        }
        if (user.isVerified) {
            throw new ApiError("Invalid", 400, translate("reject_user_update_details_request"), true);
        }
        if (user.emailVerified && userRequestData.email) {
            throw new ApiError("Invalid", 400, translate("reject_user_email_update_request"), true);
        }
        if (user.mobileVerified && userRequestData.phoneNumber) {
            throw new ApiError("Invalid", 400, translate("reject_user_phone_number_update_request"), true);
        }
        if (userRequestData.email) {
            const isEmailExists = await Users.findOne({ email: userRequestData.email });
            if (isEmailExists) {
                throw new ApiError("Invalid", 400, translate("email_already_registered", { email: userRequestData.email }), true);
            }
        }
        if (userRequestData.phoneNumber) {
            const isPhoneNumberExists = await Users.findOne({ phoneNumber: userRequestData.phoneNumber });
            if (isPhoneNumberExists) {
                throw new ApiError("Invalid", 400, translate("phoneNumber_already_registered", { phoneNumber: userRequestData.phoneNumber }), true);
            }
        }
        if (userRequestData.dateOfBirth) {
            const age = getAge(userRequestData.dateOfBirth);
            if (age < 18) {
                throw new ApiError("Invalid", 400, translate("user_age_must_be_18_or_above"), true);
            }
        }
        if (userRequestData.firstName === user.firstName && userRequestData.lastName === user.lastName && userRequestData.dateOfBirth === user.dateOfBirth) {
            throw new ApiError("Invalid", 400, translate("user_details_same_as_previous"), true);
        }
        const updateUser = await Users.updateOne(
            { _id: user._id },
            { $set: userRequestData },
        );
        if (!updateUser.modifiedCount) {
            throw new ApiError("Invalid", 400, translate("something_went_wrong"), true);
        }
        if (updateUser.modifiedCount && (userRequestData.email || userRequestData.phoneNumber)) {
            await deleteFromCache(`otp:${user.email}`);
        }
        return sendSuccessResponse(res, 200, true, translate("user_details_updated"), "update_details", userRequestData);
    } catch (error) {
        next(error);
    }
    return false;
};

export default updateDetails;
