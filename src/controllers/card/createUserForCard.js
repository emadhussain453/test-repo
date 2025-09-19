import mongoose from "mongoose";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import callApi from "../../utils/callApi.js";
import logger from "../../logger/index.js";
import PomeloUsers from "../../models/pomeloUser.js";
import { DocumentTypes, StableActiveCountryCodes } from "../../constants/index.js";

const createUserForCard = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const opts = { session };
    try {
        const { user, body: { address }, translate } = req;
        const { country: { countryCode } } = req.user;

        if (countryCode !== StableActiveCountryCodes.COL && countryCode !== StableActiveCountryCodes.MEX) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }

        if ((user?.kyc?.countryCode !== StableActiveCountryCodes.COL && !user?.kyc.documentType?.startsWith(DocumentTypes.COL.PASSPORT))
            && user?.kyc?.countryCode !== StableActiveCountryCodes.MEX && !user?.kyc.documentType?.startsWith(DocumentTypes.MEX.PASSPORT)) {
            throw new ApiError("validation_error", 400, translate("service_not_allowed"), true);
        }

        const makeAddressObjForPomelo = {
            street_name: address.streetName,
            city: address.city,
            region: address.region,
            zip_code: address.zipCode,
            country: address.countryCode.toUpperCase(),
        };
        if (address.floor) makeAddressObjForPomelo.floor = address.floor;
        if (address.apartment) makeAddressObjForPomelo.apartment = address.apartment;
        if (address.neighborhood) makeAddressObjForPomelo.neighborhood = address.neighborhood;
        if (address.additionalInfo) makeAddressObjForPomelo.additional_info = address.additionalInfo;
        if (countryCode === StableActiveCountryCodes.MEX && address.streetNumber) makeAddressObjForPomelo.street_number = address.streetNumber;

        const userPomeloDocumentType = user.kyc.pomeloDocumentType;
        const userPayload = {
            name: user.firstName,
            surname: user.lastName,
            identification_type: userPomeloDocumentType || "CC",
            identification_value: user.kyc.documentIdNumber,
            birthdate: user.dateOfBirth,
            gender: user.gender || "OTHER",
            email: user.email,
            phone: Number(user.phoneNumber),
            operation_country: address.countryCode.toUpperCase(),
            legal_address: makeAddressObjForPomelo,
        };

        const pomeloUserPayload = {
            userId: user._id,
            email: user.email,
            pomeloUserId: "temp_ids_should_be_replaced",
            pomeloClientId: "temp_ids_should_be_replaced",
            address: {
                ...makeAddressObjForPomelo,
                country: address.country,
                countryCode: address.countryCode.toUpperCase(),
            },
        };

        const newPomeloUser = new PomeloUsers(pomeloUserPayload);
        await newPomeloUser.save(opts);

        // calling pomelo user to create user
        const createUserOnPomelo = await callApi.pomelo("pomelo", "users", "POST", userPayload, false, true, false);
        if (!createUserOnPomelo.success) {
            logger.error(`pomelo :: ${createUserOnPomelo.message}`);
            throw new ApiError("Pomelo error", createUserOnPomelo.status, translate("something_went_wrong"), true);
        }
        const { results: { data } } = createUserOnPomelo;

        const isUserUpdated = await PomeloUsers.updateOne({ userId: user._id }, {
            pomeloUserId: data.id,
            pomeloClientId: data.client_id,
        }, opts);

        if (!isUserUpdated.modifiedCount) {
            throw new ApiError("Invalid details", 400, translate("something_went_wrong"), true);
        }
        // commit the transaction as passed
        await session.commitTransaction();
        session.endSession();
        return sendSuccessResponse(res, 201, true, translate("user_created_pomelo"), "pomeloUserCreated", newPomeloUser);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    return false;
};

export default createUserForCard;
