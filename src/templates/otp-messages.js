const Login = (otp) => `Your one-time log in verification code is ${otp}`;
const VerifyMobile = (otp) => `Thank you for applying for an Stable account. Your mobile verification code is ${otp}`;
const DeletePayee = (otp, rest = {}) => `${rest.payeeName} removed from your Stable account successfully.`;
const NewPayee = (otp, rest = {}) => `${rest.payeeName} added successfully. If unrecognized, contact us.`;
const P2pTransaction = (otp, rest = {}) => `Your one-time transaction verification code is ${otp}`;
const ChangeMainDevice = (otp, rest = {}) => `Your one-time main device change verification code is ${otp}`;
const OtpVerification = (otp) => `Your one-time OTP verification code is ${otp}`;

const LoginSpanish = (otp) => `Tu código de verificación único para iniciar sesión es ${otp}`;
const VerifyMobileSpanish = (otp) => `Gracias por solicitar una cuenta en Stable.Tu código de verificación móvil es ${otp}`;
const DeletePayeeSpanish = (otp, rest = {}) => `${rest.payeeName} eliminado de tu cuenta en Stable exitosamente.`;
const NewPayeeSpanish = (otp, rest = {}) => `${rest.payeeName}, agregado exitosamente. Si no lo reconoces, contáctanos.`;
const P2pTransactionSpanish = (otp, rest = {}) => `Tu código de verificación único para la transacción es ${otp}`;
const ChangeMainDeviceSpanish = (otp, rest = {}) => `Su código de verificación de cambio único de dispositivo principal es ${otp}`;
const OtpVerificationSpanish = (otp) => `Tu código de verificación único de OTP es ${otp}`;

export { Login, ChangeMainDevice, ChangeMainDeviceSpanish, VerifyMobile, DeletePayee, NewPayee, P2pTransaction, OtpVerification, LoginSpanish, VerifyMobileSpanish, DeletePayeeSpanish, NewPayeeSpanish, P2pTransactionSpanish, OtpVerificationSpanish };
