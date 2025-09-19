import { OtpTypes, PublicOtpTypes } from "../constants/index.js";
import { translateWithLenguageSpecifiedV1 } from "../middlewares/transalations.js";
import capitalizeName from "./capitalizeName.js";

const getEmailSubject = async (otpType, language) => {
    if (!otpType) return false;
    let emailSubject = "";
    switch (capitalizeName(otpType)) {
        case capitalizeName(PublicOtpTypes.ForgetPasswordEmail):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("email_subject_forgetpassowrd");
            break;
        case capitalizeName(OtpTypes.VerifyEmail):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("email_subject_verifyemail");
            break;
        case capitalizeName(OtpTypes.TransactionP2P):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("email_subject_transactionp2p");
            break;

        case capitalizeName(PublicOtpTypes.Signin):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("email_subject_signin");
            break;

        case capitalizeName(OtpTypes.DeletePayee):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("email_subject_deletepayee");
            break;

        case capitalizeName(OtpTypes.ViewPin):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("email_subject_viewpin");
            break;

        case capitalizeName(OtpTypes.UpdatePin):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("email_subject_updatepin");
            break;

        case capitalizeName(OtpTypes.CancelCard):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("email_subject_cancelcard");
            break;

        case capitalizeName(OtpTypes.DeleteAccount):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("email_subject_deleteaccount");
            break;

        case capitalizeName(OtpTypes.DirectDebit):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("email_subject_directdebit");
            break;
        case capitalizeName(OtpTypes.ChangeMainDevice):
            emailSubject = await translateWithLenguageSpecifiedV1(language)("otp_subject");
            break;
        default:
            emailSubject = otpType;
            break;
    }
    return emailSubject;
};
export default getEmailSubject;
