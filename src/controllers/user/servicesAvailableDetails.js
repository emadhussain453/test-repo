import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import { DocumentTypes, StableActiveCountryCodes } from "../../constants/index.js";

const servicesAvailableDetails = (req, res, next) => {
    try {
        const { user: { kyc, country: { countryCode } }, translate } = req;

        if (countryCode !== kyc?.countryCode) {
            const services = {
                card: true,
                onePay: false,
                finix: false,
                cashin: false,
                cashout: false,
            };
            // Card availability based on KYC information
            if ((kyc?.countryCode !== StableActiveCountryCodes.COL && !kyc.documentType?.startsWith(DocumentTypes.COL.PASSPORT))
                && kyc?.countryCode !== StableActiveCountryCodes.MEX && !kyc.documentType?.startsWith(DocumentTypes.MEX.PASSPORT)) services.card = false;
            return sendSuccessResponse(res, 200, true, translate("service_details_fetched"), "user", services);
        }
        const services = {
            card: true,
            onePay: kyc?.countryCode === StableActiveCountryCodes.COL,
            finix: kyc?.countryCode === StableActiveCountryCodes.USA,
            cashin: [StableActiveCountryCodes.COL, StableActiveCountryCodes.MEX].includes(kyc?.countryCode),
            cashout: [StableActiveCountryCodes.COL, StableActiveCountryCodes.MEX].includes(kyc?.countryCode),
        };

        // Card availability based on KYC information
        if ((kyc?.countryCode !== StableActiveCountryCodes.COL && !kyc.documentType?.startsWith(DocumentTypes.COL.PASSPORT))
            && kyc?.countryCode !== StableActiveCountryCodes.MEX && !kyc.documentType?.startsWith(DocumentTypes.MEX.PASSPORT)) services.card = false;

        return sendSuccessResponse(res, 200, true, translate("service_details_fetched"), "user", services);
    } catch (error) {
        next(error);
    }
    return false;
};

export default servicesAvailableDetails;
