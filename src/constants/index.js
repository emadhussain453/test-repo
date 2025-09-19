import { Login, VerifyMobile, P2pTransaction, OtpVerification, LoginSpanish, VerifyMobileSpanish, P2pTransactionSpanish, OtpVerificationSpanish } from "../templates/otp-messages.js";
import VerifyEmail from "../templates/verify-email.js";
import OtpNotificationTemplate from "../templates/otpNotificationTemplate.js";
import WelcomeAtSignup from "../templates/welcome-at-signup.js";
import ForgetPasswordEmail from "../templates/forget-password.js";
import SigninMessage from "../templates/signinMessage.js";
import P2pTransactionTemplate from "../templates/p2ptransaction.js";
import PSECompletionURL from "../templates/PSECompletionUrl.js";
import MovementTemplate from "../templates/movementTemplate.js";
import OnboardingCompletedGreetWelcome from "../templates/onboardingCompleted-welcome.js";
import OnboardingCompletedGreetWelcomeSpanish from "../templates/onboardingCompleted-welcomeSpanish.js";
import MovementTemplateSpanish from "../templates/movementTemplateSpanish.js";
import OtpNotificationTemplateSpanish from "../templates/otpNotificationTemplateSpanish.js";
import PSECompletionURLSpanish from "../templates/PSECompletionUrlSpanish.js";
import SupportEmailTemplate from "../templates/supportEmailTemplate.js";
import SupportEmailTemplateSpanish from "../templates/supportEmailTemplateSpanish.js";
import CardTransactionTemplet from "../templates/cardTransactionTemplate.js";
import CardTransactionTempletSpanish from "../templates/cardTransactionTemplateSpanish.js";
import OrderCardSpanishTemplate from "../templates/orderCardSpanishTemplate.js";
import OrderCardTemplate from "../templates/orderCardTemplate.js";
import ActivateCardSpanishTemplate from "../templates/activateCardSpanishTemplate.js";
import ActivateCardTemplate from "../templates/activateCardTemplate.js";
import CardOrderAlertMinBalance from "../templates/cardOrderAlterMinBalance.js";
import CardOrderNowMinBalance from "../templates/cardOrderNowMinBalance.js";
import CardOrderAlertMinBalanceSpanish from "../templates/cardOrderAlertMinBalanceSpanish.js";
import CardOrderNowMinBalanceSpanish from "../templates/cardOrderNowMinBalanceSpanish.js";
import EffectyEmailTemplate from "../templates/effectyEmailTemplate.js";
import EffectyEmailTemplateSpanish from "../templates/effectyEmailTemplateSpanish.js";
import EffectyCashinSpanishTemplate from "../templates/effectyCashinSpanishTemplate.js";
import EffectyCashinTemplate from "../templates/effectyCashinTemplate.js";
import KEYS from "../config/keys.js";
import failedCardTemplate from "../templates/failedTransactionCardTemplate.js";
import failedCardTemplateSpanish from "../templates/failedCardTemplateSpanish.js";

const Stable = "Stable";

const HttpStatusCode = {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER: 500,
    RATE_LIMITTER: 429,
};

const customLevels = {
    levels: {
        trace: 5,
        debug: 4,
        info: 3,
        warn: 2,
        error: 1,
        fatal: 0,
    },
    colors: {
        trace: "white",
        debug: "green",
        info: "green",
        warn: "yellow",
        error: "red",
        fatal: "red",
    },
};

const RoleTypes = Object.freeze({
    USER: "user",
    ADMIN: "admin",
});
const businessTypes = Object.freeze({
    SUBSIDIARY: "SUBSIDIARY",
    BUSSINESS: "BUSSINESS",
});
const Flags = Object.freeze({
    ONE: 1,
    TWO: 2,
    THREE: 3,
});

const FlagsWithColor = Object.freeze({
    GREEN: 0,
    YELLOW: 10,
    ORANGE: 40,
    RED: 100,
});

const FlagsReasons = Object.freeze({
    TWO_DEVICES: "User has logged in from a second device.",
    MORE_THAN_ONE_DEVICES: "User has logged in from more than one device.",
    MORE_THAN_TWO_DEVICES: "User has logged in from more than two devices.",
    TWO_ACCOUNT_USING_SAME_DEVICE: "Multiple STABLE accounts are being accessed from the same device and IP address.",
    CASHOUT_AFTER_CASHIN: "User performed a full cash-out immediately after a cash-in.",
    P2P_AFTER_CASHIN: "User transferred the entire cash-in amount via P2P transactions immediately after cash-in.",
});

const RateLimitTypes = Object.freeze({
    SIGNUP: "Signup",
    LOGIN: "Login",
    FORGOT_PASSWORD: "Forgot Password",
    RESET_PASSWORD: "Reset Password",
    VERIFY_EMAIL: "Verify Email",
    RESEND_EMAIL: "Resend Email",
    CHANGE_PASSWORD: "Change Password",
    NORMAL_API: "API",
});

const RateLimit = Object.freeze({
    ONE: 1000,
    THREE: 3000,
    FIVE: 5000,
    TEN: 10000,
    FIFTY: 50000,
    HUNDRED: 100000,
});

const RateLimitTimeFrame = Object.freeze({
    ONE_MINUTE: 60 * 1000,
    FIFTEEN_MINUTES: 15 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
});

const OtpTypes = Object.freeze({
    VerifyEmail: "verifyEmail",
    VerifyMobile: "verifyMobile",
    ForgetPasswordEmail: "forgetPasswordEmail",
    ForgetPasswordNumber: "forgetPasswordNumber",
    Signin: "signin",
    TransactionP2P: "transactionP2P",
    DeletePayee: "deletePayee",
    ViewPin: "viewPin",
    UpdatePin: "updatePin",
    CancelCard: "cancelCard",
    DeleteAccount: "deleteAccount",
    DirectDebit: "directDebit",
    ChangeMainDevice: "changeMainDevice",
});
const PrivateOtpTypes = Object.freeze({
    VerifyEmail: "verifyEmail",
    VerifyMobile: "verifyMobile",
    TransactionP2P: "transactionP2P",
    DeletePayee: "deletePayee",
    ViewPin: "viewPin",
    UpdatePin: "updatePin",
    CancelCard: "cancelCard",
    DeleteAccount: "deleteAccount",
    DirectDebit: "directDebit",
});
const PublicOtpTypes = Object.freeze({
    ForgetPasswordEmail: "forgetPasswordEmail",
    // ForgetPasswordNumber: "forgetPasswordNumber",
    Signin: "signin",
});

const arrayofRequiredFields = Object.freeze({
    SignUp: ["firstName", "lastName", "countryCode", "email", "phoneNumber", "password", "confirmPassword", "dateOfBirth", "gender"],
    SignIn: ["email", "password"],
    ForgetPasswordEmail: ["email"],
    restPassword: ["email", "password", "confirmPassword"],
    VerifyOtp: ["otp", "email", "type"],
    privateResendOtp: ["type"],
    publicResendOtp: ["type", "email"],
    cashInCard: ["amount", "description", "cvv", "card_number", "expiration_month", "expiration_year"],
    cashInPSE: ["amount", "description", "countryCode"],
    cashInDyn: ["amount", "description", "methodName"],
    cashInDynV2: ["amount", "description", "bankCode", "type"],
    cashOut: ["amount", "bankName", "countryCode", "category"],
    onepayCreatepayment: ["amount"],
    cancelAndStatusCashout: ["cashoutId"],
    makeTransaction: ["amount", "phoneNumber", "description", "otp"],
    getUser: ["phoneNumber"],
    VerifyEmailOrNumber: ["otp", "email"],
    registerUserCardToApplePay: ["card_id", "certificates", "nonce", "nonce_signature", "user_id"],
    changeCurrentPassword: ["currentPassword", "newPassword", "confirmNewPassword"],
    verifyCurrentPassword: ["currentPassword"],
});

const EmailTemplates = Object.freeze({
    VerifyEmail,
    WelcomeAtSignup,
    ForgetPasswordEmail,
    SigninMessage,
    P2pTransactionTemplate,
    PSECompletionURL,
    OtpNotificationTemplate,
    MovementTemplate,
    OnboardingCompletedGreetWelcome,
    OnboardingCompletedGreetWelcomeSpanish,
    MovementTemplateSpanish,
    OtpNotificationTemplateSpanish,
    PSECompletionURLSpanish,
    SupportEmailTemplate,
    SupportEmailTemplateSpanish,
    CardTransactionTemplet,
    CardTransactionTempletSpanish,
    OrderCardSpanishTemplate,
    OrderCardTemplate,
    ActivateCardSpanishTemplate,
    ActivateCardTemplate,
    CardOrderNowMinBalance,
    CardOrderNowMinBalanceSpanish,
    CardOrderAlertMinBalance,
    CardOrderAlertMinBalanceSpanish,
    EffectyEmailTemplate,
    EffectyEmailTemplateSpanish,
    failedCardTemplate,
    failedCardTemplateSpanish,
    EffectyCashinSpanishTemplate,
    EffectyCashinTemplate,
});

const OtpMessage = Object.freeze({
    Login,
    VerifyMobile,
    P2pTransaction,
    OtpVerification,
    LoginSpanish,
    VerifyMobileSpanish,
    P2pTransactionSpanish,
    OtpVerificationSpanish,
});

const Payvalida = Object.freeze({
    countryCode: 343,
    currency: "USD",
    iva: "0",
    country: "CO",
});

const DirectaPaymentMethods = Object.freeze({
    COL: {
        PUNTO_RED: "PD",
        MERCADOPAGO: "ME",
        PSE: "PC",
        VISA: "VI",
        MASTERCARD: "MC",
        AMERICAN_EXPRESS: "AE",
        ALMACENES_EXITO: "EX",
        CARULLA: "CR",
        SURTIMAX: "SX",
        JER: "JE",
        SU_CHANCE: "CX",
        CON_SUERTE: "XU",
        SUPERINTER: "XI",
        COOPENESSA: "XC",
        EDEQ: "DQ",
        DIMONEX: "DX",
        FULLCARGA: "FG",
        MOVIIRED: "MR",
        SU_SUERTE: "SR",
        SURTI_MAYORISTA: "SZ",
        SU_RED: "RD",
        EFECTY: "EY",
    },
    MEX: {
        ERCADOPAGO: "ME",
        SPEI: "SE",
        VISA: "VI",
        VISA_DEBIT: "VD",
        MASTERCARD: "MC",
        MASTERCARD_DEBIT: "MD",
        AMERICAN_EXPRESS: "AE",
        OXXO: "OX",
        CODI: "COD", // payment method not available
        BANCO_AZTECA: "AZ",
        BBVA_BANCOMER: "BV",
        BBVA_BANCOMER_ONLINE: "BVL",
        BANAMEX: "BM",
        SANTANDER_SUPERNET: "STS",
        SANTANDER: "SM",
        AFIRME_ONLINE_BANKING: "AF",
        TODITO_CASH: "TC",
        PAYNET: "PN",
        FARMACIA_DEL_AHORRO: "FA",
        BODEGA_AURRERA: "BW",
        BROXEL: "BRX",
        EXTRA: "EA",
        CALIMAX: "CLX",
        FARMACIA_BENAVIDES: "FB",
        CIRCULO_K: "CU",
        ELEVEN_7: "EN",
        SAMS_CLUB: "SS",
        FARMACIA_LA_MAS_BARATA: "FL",
        KLINC: "KL",
        ROMA: "RO",
        SORIANA: "SQ",
        SUPERAMA: "SU",
        SUPERCITY: "SW",
        TOMIIN: "TMN",
        TELECOMM: "TO",
        WALMART_EXPRESS: "WE",
        WALMART: "WA",
        BAZ_SUPERAPP: "BAZ",
        BANORTE_ONLINE_BANKING: "BQL",
        PAYPAL: "PPL",
    },
    CHI: {
        BANCO_DE_CHILE: "BX",
        BANCE_ESTADO: "BE",
        BANCO_BICE: "CE",
        BANCO_BCI: "CI",
        CAJA_VECINA: "KV",
        EXPRESS_LIDER: "XL",
        SENCILLITO: "SL",
        MERCADOPAGO: "ME",
        LIDER: "LI",
    },
});

const CashOutMethods = Object.freeze({
    COL: {
        BANCO_COLPATRIA: "019",
        BANCO_DE_BOGOTA: "001",
        BANCO_POPULAR: "002",
        ITAU_Antes_CORPBANCA: "006",
        BANCOLOMBIA: "007",
        CITIBANK: "009",
        HSBC: "010",
        BANCO_SUDAMERIS: "012",
        BBVA: "013",
        ITAU_HELM: "014",
        BANCO_DE_OCCIDENTE: "023",
        BANCO_CAJA_SOCIAL_BCSC: "032",
        BANCO_AGRARIO: "040",
        BANCO_DAVIVIENDA: "051",
        BANCO_AV_VILLAS: "052",
        BANCO_PROCREDIT: "058",
        BANCO_PICHINCHA: "060",
        BANCOOMEVA: "061",
        BANCO_FALABELLA_SA: "062",
        SANTANDER: "065",
        LULO_BANK_SA: "070",
        JP_MORGAN_COLOMBIA: "071",
        COOPCENTRAL_SA: "076",
        COOPERATIVA_FINANCIERA_DE_ANTIOQUIA: "283",
        COTRAFA_COOPERATIVA_FINANCIERA: "289",
        COOFINEP: "291",
        CONFIAR: "292",
        BANCO_UNION: "303",
        COLTEFINANCIERA: "370",
        BANCO_CREDIFINANCIERA_SA: "558",
        IRIS: "637",
        MOVII: "801",
        RAPPIPAY: "811",
        NEQUI: "1507",
        DAVIPLATA: "1551",
        EFECTY: "10003",
        TPAGA_WALLET: "10005",
        PUNTO_RED: "10006",
    },
});

const CashuotMethodsCategories = Object.freeze({
    COL: {
        BANK: {
            BANCO_COLPATRIA: "019",
            BANCO_DE_BOGOTA: "001",
            BANCO_POPULAR: "002",
            ITAU_Antes_CORPBANCA: "006",
            BANCOLOMBIA: "007",
            CITIBANK: "009",
            HSBC: "010",
            BANCO_SUDAMERIS: "012",
            BBVA: "013",
            ITAU_HELM: "014",
            BANCO_DE_OCCIDENTE: "023",
            BANCO_CAJA_SOCIAL_BCSC: "032",
            BANCO_AGRARIO: "040",
            BANCO_DAVIVIENDA: "051",
            BANCO_AV_VILLAS: "052",
            BANCO_PROCREDIT: "058",
            BANCO_PICHINCHA: "060",
            BANCOOMEVA: "061",
            BANCO_FALABELLA_SA: "062",
            SANTANDER: "065",
            LULO_BANK_SA: "070",
            JP_MORGAN_COLOMBIA: "071",
            COOPCENTRAL_SA: "076",
            COOPERATIVA_FINANCIERA_DE_ANTIOQUIA: "283",
            COTRAFA_COOPERATIVA_FINANCIERA: "289",
            COOFINEP: "291",
            CONFIAR: "292",
            BANCO_UNION: "303",
            COLTEFINANCIERA: "370",
            BANCO_CREDIFINANCIERA_SA: "558",
            IRIS: "637",
            PUNTO_RED: "10006",
        },
        CASH: {
            EFECTY: "10003",
        },
        WALLET: {
            NEQUI: "1507",
            DAVIPLATA: "1551",
            RAPPIPAY: "811",
            TPAGA_WALLET: "10005",
            MOVII: "801",
        },
    },
    MEX: {
        BANK: {
            BANAMEX: "002",
            BANCOMEXT: "006",
            BANOBRAS: "009",
            BBVA_BANCOMER: "012",
            SANTANDER: "014",
            BANJERCITO: "019",
            HSBC: "021",
            BAJIO: "030",
            IXE: "032",
            INBURSA: "036",
            INTERACCIONES: "037",
            MIFEL: "042",
            SCOTIABANK: "044",
            BANREGIO: "058",
            INVEX: "059",
            BANSI: "060",
            AFIRME: "062",
            BANORTE: "072",
            THE_ROYAL_BANK: "102",
            AMERICAN_EXPRESS: "103",
            BAMSA: "106",
            TOKYO: "108",
            JP_MORGAN: "110",
            BMONEX: "112",
            VE_POR_MAS: "113",
            ING: "116",
            DEUTSCHE: "124",
            CREDIT_SUISSE: "126",
            AZTECA: "127",
            AUTOFIN: "128",
            BARCLAYS: "129",
            COMPARTAMOS: "130",
            BANCO_FAMSA: "131",
            BMULTIVA: "132",
            ACTINVER: "133",
            WALMART: "134",
            NAFIN: "135",
            INTERBANCO: "136",
            BANCOPPEL: "137",
            ABC_CAPITAL: "138",
            UBS_BANK: "139",
            CONSUBANCO: "140",
            VOLKSWAGEN: "141",
            CIBANCO: "143",
            BBASE: "145",
            BANKAOOL: "147",
            PAGATODO: "148",
            INMOBILIARIO: "150",
            DONDE: "151",
            BANCREA: "152",
            BANCO_COVALTO: "154",
            SABADELL: "156",
            BANSEFI: "166",
            HIPOTECARIA_FEDERAL: "168",
            MONEXCB: "600",
            GBM: "601",
            MASARI: "602",
            VALUE: "605",
            ESTRUCTURADORES: "606",
            TIBER: "607",
            VECTOR: "608",
            MERRILL_LYNCH: "615",
            FINAMEX: "616",
            VALMEX: "617",
            UNICA: "618",
            MAPFRE: "619",
            PROFUTURO: "620",
            CB_ACTINVER: "621",
            OACTIN: "622",
            SKANDIA_VIDA: "623",
            CBDEUTSCHE: "626",
            ZURICH: "627",
            ZURICHVI: "628",
            SU_CASITA: "629",
            CB_INTERCAM: "630",
            CI_BOLSA: "631",
            BULLTICK_CB: "632",
            STERLING: "633",
            FINCOMUN: "634",
            HDI_SEGUROS: "636",
            ORDER: "637",
            NUBANK: "638",
            CB_JPMORGAN: "640",
            REFORMA: "642",
            STP: "646",
            TELECOMM: "647",
            EVERCORE: "648",
            SKANDIA_OPERADORA: "649",
            SEGMTY: "651",
            ASEA: "652",
            KUSPIT: "653",
            SOFIEXPRESS: "655",
            UNAGRA: "656",
            OPCIONES_EMPRESARIALES_DEL_NOROESTE: "659",
            LIBERTAD: "670",
            MERCADO_PAGO_W: "722",
            CLS: "901",
            INDEVAL: "902",
            TODITOCASH: "10000",
            KIOSKO: "10008",
            B_AND_B: "610",
        },
    },
});

const CashoutCategories = Object.freeze({
    BANK: "BANK",
    CASH: "CASH",
    WALLET: "WALLET",
});

const Status = Object.freeze({
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    PROCESSING: "PROCESSING",
    TO_PROCESS: "TO_PROCESS",
    NOT_AUTHORIZED: "NOT_AUTHORIZED",
    PROCESSED: "PROCESSED",
    PENDING: "PENDING",
    CANCELLED: "CANCELLED",
    REJECTED: "REJECTED",
    REFUNDED: "REFUNDED",
    EXPIRED: "EXPIRED",
    SUCCESS: "SUCCESS",
    ON_HOLD: "ON_HOLD",
    DELIVERED: "DELIVERED",
    INPROGRESS: "IN_PROGRESS",
    DECLINE: "DECLINE",
    DECLINED: "DECLINED",
    APPROVED: "APPROVED",
    SUCCEEDED: "SUCCEEDED",
    OK: "OK",
    approvedTransaction: "APPROVEDTRANSACTION",
    declinedTransaction: "DECLINEDTRANSACTION",
});

const ShipmentStatus = Object.freeze({
    CREATED: "CREATED",
    PENDING: "PENDING",
    TRACKED: "TRACKED",
    REJECTED: "REJECTED",
    IN_WAREHOUSE: "IN_WAREHOUSE",
    IN_TRANSIT: "IN_TRANSIT",
    FAILED_DELIVERY_ATTEMPT: "FAILED_DELIVERY_ATTEMPT",
    DISTRIBUTION: "DISTRIBUTION",
    DELIVERED: "DELIVERED",
    NOT_DELIVERED: "NOT_DELIVERED",
    START_OF_CUSTODY: "START_OF_CUSTODY",
    END_OF_CUSTODY: "END_OF_CUSTODY",
    DESTRUCTION: "DESTRUCTION",
    ACCIDENT: "ACCIDENT",
});

const d24WebhookCashoutStatus = Object.freeze({
    0: "PENDING",
    1: "COMPLETED",
    2: "CANCELLED",
    3: "REJECTED",
    4: "DELIVERED",
    5: "ON_HOLD",
});

const DirectaCountryCodes = Object.freeze({
    COL: "CO",
    MEX: "MX",
    CHI: "CL",
});
const DirectaMinimumValues = Object.freeze({
    COP: {
        CASHIN: 10000,
        CASHOUT: 500,
    },
    MEX: {
        CASHIN: 900, //  random
        CASHOUT: 500,
    },
    CHI: {
        CASHIN: 900,
        CASHOUT: 500,
    },
});
const StableMinimumUSD = Object.freeze({
    CASHIN: 25,
    CASHOUT: 50,
    P2P: 1,
    ONEPAY: 1.25,
});
const StableMaximumUSD = Object.freeze({
    CASHIN: 2400, // dummy
    CASHOUT: 50, // dummy
    P2P: 1, // dummy
    ONEPAY: 2400,
});
const CountryCurrencies = Object.freeze({
    COL: "COP",
    MEX: "MXN",
    CHI: "CLP",
    GLOBAL: "USD",
});

const StableActiveCountryCodes = Object.freeze({
    COL: "COL",
    USA: "USA",
    BRA: "BRA",
    MEX: "MEX",
    GLOBAL: "GLOBAL",
});
const StableCurrencies = Object.freeze({
    SUSD: "SUSD",
    COP: "COP",
    MXN: "MXN",
    CLP: "CLP",
    GLOBAL: "USD",
});

const StableServicesFeatures = Object.freeze({
    DIRECTA24: {
        CASHIN: "CASHIN",
        CASHOUT: "CASHOUT",
    },
    ONEPAY: {
        CASHIN: "CASHIN",
        CASHOUT: "CASHOUT",
    },
});

const RedisConnectionObject = Object.freeze({
    host: KEYS.REDIS_CLOUD.HOST,
    port: KEYS.REDIS_CLOUD.PORT,
    password: KEYS.REDIS_CLOUD.PASSWORD,
});

const BusinessRedisConnectionObject = Object.freeze({
    host: KEYS.BUSINESS_REDIS_CLOUD.HOST,
    port: KEYS.BUSINESS_REDIS_CLOUD.PORT,
    password: KEYS.BUSINESS_REDIS_CLOUD.PASSWORD,
});
const QueueConcurrencyCount = Object.freeze({
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FIVE: 5,
    TEN: 10,
});

const NotificationPriority = Object.freeze({
    ONE: 1,
    TWO: 2,
    THREE: 3,
});
const ExTypes = Object.freeze({
    Buying: "buying",
    Selling: "selling",
});

const EventTypes = Object.freeze({
    Notification: "notification",
    UpdateDevicesInformation: "updateDevicesInformation",
    NotificationError: "notificationError",
    beckEndLogs: "systemLogs",
    CreateUserOnHubspot: "createUserOnHubspot",
    GenerateBlurHash: "generateBlurHash",
    UpdateCustomerLifeCycleStage: "updateCustomerLifeCycleStage",
    OpenAILogs: "openAILogs",
    PomeloCardNotification: "pomeloCardNotification",
    HmacMonitering: "hmacmonitering",
    FailedCardTransactionCount: "failedCardTransactionCount",
    checkForSameIpAndDevice: "checkForSameIpAndDevice",
    UpdateUserScore: "updateUserScore",
});

const ScoreKeys = Object.freeze({
    KYC: "kyc",
    FIRST_CASHIN: "firstCashin",
    ORDER_PHYSICAL_CARD: "orderPhysicalCard",
    ORDER_VIRTUAL_CARD: "orderVirtualCard",
    ACTIVATE_CARD: "activatePhysicalCard",
    REACH_MIN_CASHIN_THRESHOLD: "reachMinimumCashinThreshold",
    KEEP_BALANCE: "keepBalance",
    CARD_TRANSACTION: "cardTransaction",
    CASHIN_TRANSACTIONS: "cashinTransactions",
    SUBSCRIPTION: "subscription",
    RECHARGE: "recharge",
    PAYBILL: "payBill",
    DOCUMENTATION_VERIFICATION: "documentVerification",
    RESET_SOFT_BLOCK: "resetSoftBlock",

    FAILED_TXN: "failedTxn",
    CASHIN_OUT_SAME: "cashinOutSame",
    MULTI_IP: "multiIp",
    MULTI_DEVICES: "multiDevices",
    INACTIVE: "inactive",
    FUND_TRANS_TO_SUSPICIOUS_USER: "funsTransferToSuspiciousUser",
});

const NotificationTitles = Object.freeze({
    Account_Activity: "Account activity",
    Card_Activity: "Card Activity",
    Payment_Confirmation: "Payment confirmation",
    Payment_Failed: "Payment Failed",
    Low_Balance_Alert: "Low balance alert",
    Reminder: "Reminder",
    Customer_Service: "Customer Service",
});

const NotificationTypes = Object.freeze({
    AccountActivity: "AccountActivity",
    Card_Activity: "CardActivity",
    PaymentConfirmation: "PaymentsConfirmation",
    PaymentFailed: "PaymentFailed",
    LowBalanceAlert: "LowBalanceAlert",
    Reminder: "Reminder",
    CustomerService: "CustomerService",
});
const CountryCodes = Object.freeze({
    COL: "Colombia",
    MEX: "Mexico",
    // CHI: "Chile",
    USA: "United States",
    BRA: "Brazil",
    GLOBAL: "GLOBAL",
});
const CountryCodesOnly = Object.freeze({
    COL: "COL",
    MEX: "MEX",
    CHI: "CHI",
});

const DirectaCardPaymentMethods = Object.freeze({
    COL: ["VI", "MC", "AE"],
    MEX: ["VI", "VD", "MC", "MD", "AE"],
    CHI: [],
});
const DirectaBankDepositPaymentMethods = Object.freeze({
    COL: ["ME", "PC", "EX", "CR", "SX", "JE", "CX", "LF", "XU", "XI", "XC", "XT", "DQ", "DX", "FG", "MR", "SR", "SZ", "RD", "AO", "EY", "GC"],
    MEX: ["ME", "SE", "OX", "COD", "AZ"],
    CHI: ["BX", "BE", "CE", "CI", "KV", "XL", "SL", "ME", "LI"],
});

const PomeloCardTypes = Object.freeze({
    PHYSICAL: "PHYSICAL",
    VIRTUAL: "VIRTUAL",
});

const PomeloCardBLockStatus = Object.freeze({
    ACTIVE: "ACTIVE",
    BLOCKED: "BLOCKED",
    DISABLED: "DISABLED",
});

const PomeloCardBLockResons = Object.freeze({
    CLIENT_INTERNAL_REASON: "CLIENT_INTERNAL_REASON",
    USER_INTERNAL_REASON: "USER_INTERNAL_REASON",
    LOST: "LOST",
    STOLEN: "STOLEN",
    BROKEN: "BROKEN",
    UPGRADE: "UPGRADE",
});

const PomeloWebhookStatus = Object.freeze({
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
});

const PomeloWebhookStatusDetails = Object.freeze({
    APPROVED: "APPROVED",
    INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
    INVALID_MERCHANT: "INVALID_MERCHANT",
    INVALID_AMOUNT: "INVALID_AMOUNT",
    SYSTEM_ERROR: "SYSTEM_ERROR",
    OTHER: "OTHER",
});

const TrnasactionsTypes = Object.freeze({
    CREDIT: "credit",
    DEBIT: "debit",
});

const tapiTransactionTypes = Object.freeze({
    SERVICE: "SERVICE",
    RECHARGE: "RECHARGE",
    SUBSCRIPTION: "SUBSCRIPTION",
});
const PomeloWebhookMethods = Object.freeze({
    TRANSACTIONS_CREDIT: "transactions_credit",
    TRANSACTIONS_DEBIT: "transactions_debit",
    TRANSACTIONS_AUTHORIZATION_DEBIT: "transactions_authorization_debit",
});

const PomeloTransactionOrigin = Object.freeze({
    INTERNATIONAL: "INTERNATIONAL",
    DOMESTIC: "DOMESTIC",
});

const POMELO_IP_ADDRESSES = Object.freeze([...KEYS.POMELO.WHITELIST_IPS.split(",")]);

const Genders = Object.freeze(["MALE", "FEMALE", "OTHER"]);

const feeTypes = Object.freeze({
    MONTHLY_FEE: "monthly_fee",
    P2P_TRANSACTION_LOCAL: "p2p_transaction_local",
    P2P_TRANSACTION_INTERNATIONAL: "p2p_transaction_international",
    B2C_TRANSACTION_LOCAL: "b2c_transaction_local",
    B2C_TRANSACTION_INTERNATIONAL: "b2c_transaction_international",
    CARD_TRANSACTION_DOMESTIC: "card_transaction_domestic",
    CARD_TRANSACTION_INTERNATIONAL: "card_transaction_international",
    CARD_ACTIVATION: "card_activation",
    CARD_ATM_TRANSACTION: "card_atm_transaction",
    REORDER_CARD: "re_order_card",
});

const AmountCalculationType = Object.freeze({
    PERCENTAGE: "percentage",
    FLAT: "flat",
});

const Lenguages = Object.freeze({
    English: "en",
    Spanish: "es",
});

const InternationalCountryCodes = Object.freeze({
    COL: "COL",
    MEX: "MEX",
    CHI: "CHI",
    ARG: "ARG",
});
const StableThirdpartyServices = Object.freeze({
    DIRECTA24: "DIRECTA24",
    FINIX: "FINIX",
    POMELO: "POMELO",
    BULKSMS: "BULKSMS",
    SENDGRID: "SENDGRID",
    NETACTICA: "NETACTICA",
    TAPI: "TAPI",
});

const DocumentTypes = Object.freeze({
    COL: {
        DRIVING_LICENSE: "CC",
        ID_CARD: "CC",
        PASSPORT: "PASS",
    },
    MEX: {
        PASSPORT: "PASS",
        PASSPORT_FOR_POMELO: "PASSPORT",
        ID_CARD: "CURP",
        ID_CARD_FOR_POMELO: "INE",
        IFE: "IFE",
    },
    CHI: {
        ID_CARD: "ID",
        RUN: "RUN",
        RUT: "RUT",
    },
});
const OnePayPaymentEvents = Object.freeze({
    DELETED: "payment.deleted",
    // CREATED: "payment.created",
    REJECTED: "payment.rejected",
    APPROVED: "payment.approved",
    EXPIRED: "payment.expired",
});

const OnePayCashoutPaymentEvents = Object.freeze({
    COMPLETED: "cashout.completed",
    // PROCESSING: "cashout.processing",
    CANCELLED: "cashout.cancelled",
    REJECTED: "cashout.rejected",
});
const FeatureNames = Object.freeze({
    cashin: "cashin",
    cashout: "cashout",
    p2p: "p2p",
    card: "card",
    onepay: "onepay",
    finix: "finix",
});

const PubSubChannels = Object.freeze({
    Notifications: "notifications",
    UpdateBalance: "updateBalance",
    BalanceUpdate: "BalanceUpdate",
});

const ExpirySeconds = Object.freeze({
    s30: 30,
    s1: 1,
    m1: 60,
    m5: 300,
    m10: 600,
    m15: 900,
    m30: 1800,
    h1: 3600,
    h3: 10800,
    h6: 21600,
    h12: 43200,
    d1: 86400,
});

const StableModelsNames = Object.freeze({
    CASHIN: "transaction_cashin",
    CASHIN_V1: "transactions_cashins_v1",
    CASHOUT: "transactions_cashout",
    P2P: "transactions_p2p",
    CARD: "transactions_card",
    B2C: "business_transactions",
    FEE: "transactions_fee",
});

const HubspotCustomerLifecycleStages = Object.freeze({
    CUSTOMER: "customer",
    HOT_LEAD: 168570965,
    NOT_ACCEPTED: 168505915,
    BLOCKED: 168554024,
    ACTIVE: 168570996,
    INACTIVE: 168505928,
    LOST_CUSTOMER: 168610668,
});

const AppEnviornments = Object.freeze({
    PRODUCTION: "production",
    DEVELOPMENT: "development",
    LOCAL: "local",
});
const SoftBlockTypes = Object.freeze({
    PASSCODE: {
        key: "invalid_passcode_attempts",
        reason: "Duo to multiple invalid passcode attempts your account has been blocked. Please contact support for futher assistance.",
    },
});
const PromotionsType = Object.freeze({
    1: "Mastercard_Promotions",
});

const CronJobs = Object.freeze({
    MinBalanceAlertsForCard: "minBalanceAlertsForCard",
    ActivateCardAlerts: "activateCardAlerts",
    GiveScoreOnCompletedTransactions: "giveScoreOnCompletedTransactions",
});

const AiPriseKycStatus = Object.freeze({
    APPROVED: "APPROVED",
    REVIEW: "REVIEW",
    DECLINED: "DECLINED",
    UNKNOWN: "UNKNOWN",
    DECLINED_BY_STABLE: "DECLINED_BY_STABLE",
});

const AiPriseIdTypes = Object.freeze({
    COL: {
        DRIVER_LICENSE: "DRIVER_LICENSE",
        NATIONAL_ID: "NATIONAL_ID",
        PASSPORT: "PASSPORT",
        RESIDENT_CARD: "RESIDENT_CARD",
    },
    MEX: {
        RESIDENT_CARD: "RESIDENT_CARD",
        VOTER_ID_CARD: "VOTER_ID_CARD",
        PASSPORT: "PASSPORT",
        ID_CARD: "ID_CARD",
    },
});

const StableServicesIdTypes = Object.freeze({
    COL: {
        DRIVER_LICENSE: "CC",
        NATIONAL_ID: "CC",
        PASSPORT: "PASS",
        PASSPORT_FOR_POMELO: "PASSPORT",
        RESIDENT_CARD: "CC",
    },
    MEX: {
        RESIDENT_CARD: "CURP",
        VOTER_ID_CARD: "CURP",
        PASSPORT: "PASS",
        PASSPORT_FOR_POMELO: "PASSPORT",
        ID_CARD: "CURP",
        ID_CARD_FOR_POMELO: "INE",
    },
});

const locales = Object.freeze({
    COP: "es-CO",
    MXN: "es-MX",
    USD: "en-US",
});

const TransactionTypes = Object.freeze({
    Cashin: "cashin",
    Cashout: "cashout",
    P2P: "p2p",
    Card: "card",
    B2C: "b2c",
    Onepay_CASHIN: "cashin|onepay",
    Onepay_CASHOUT: "cashout|onepay",
    Kushki_CASHIN: "cashin|kushki",
    Kushki_CASHOUT: "cashout|kushki",
    Kushki_PAYMENTLINK: "paymentLink|kushki",
    Finix: "cashin|finix",
    FEE: "fee",
});
const Applications = Object.freeze({
    STABLE_APP: "stable-app",
    STABLE_BUSINESS: "stable-business",
});
const ErrorCodes = Object.freeze({
    AUTHENTICATION: {
        INVALID_CREDENTIALS: "E1A01IC",
        USER_NOT_FOUND: "E1A02U",
        ACCOUNT_LOCKED: "E1A03AL",
    },
    AUTHORIZATION: {
        ACCESS_DENIED: "E2A01AD",
        INVALID_SIGNATURE: "E2A02IS",
        REPLAY_ATTACK: "E2A03RT",
    },
    TOKEN: {
        JWT_EXPIRED: "E3A01TE",
        JWT_INVALID: "E3A02JI",
        JWT_MISSING: "E3A03JM",
    },
    REQUEST_VALIDATION: {
        MISSING_PARAMETERS: "E4A01MP",
        INVALID_PARAMETERS: "E4A02IP",
    },
    SERVER: {
        INTERNAL_ERROR: "E5A01IE",
        SERVICE_UNAVAILABLE: "E5A02SU",
    },
    RATE_LIMITING: {
        TOO_MANY_REQUESTS: "E6A01RT",
    },
});

const AwsSESConnectionObect = Object.freeze({
    credentials: {
        accessKeyId: KEYS.AWS.SES_ACCESS_KEY,
        secretAccessKey: KEYS.AWS.SES_SECRET_KEY,
    },
    region: KEYS.AWS.REGION,
});

const KushkiWebhookEvents = Object.freeze({
    APPROVED: "approvedTransaction",
    DECLINED: "declinedTransaction",
});
export {
    Stable,
    Applications,
    KushkiWebhookEvents,
    locales,
    HttpStatusCode,
    customLevels,
    RateLimitTypes,
    RateLimit,
    RateLimitTimeFrame,
    RoleTypes,
    OtpTypes,
    EmailTemplates,
    OtpMessage,
    Payvalida,
    Status,
    ShipmentStatus,
    AwsSESConnectionObect,
    arrayofRequiredFields,
    DirectaCountryCodes,
    CountryCurrencies,
    StableCurrencies,
    RedisConnectionObject,
    BusinessRedisConnectionObject,
    QueueConcurrencyCount,
    DirectaPaymentMethods,
    ExTypes,
    EventTypes,
    ScoreKeys,
    NotificationTitles,
    NotificationPriority,
    Flags,
    FlagsWithColor,
    FlagsReasons,
    DirectaMinimumValues,
    CountryCodes,
    NotificationTypes,
    DirectaCardPaymentMethods,
    DirectaBankDepositPaymentMethods,
    CashOutMethods,
    PomeloCardTypes,
    PomeloCardBLockStatus,
    PomeloCardBLockResons,
    PomeloWebhookStatus,
    PomeloWebhookStatusDetails,
    TrnasactionsTypes,
    PomeloWebhookMethods,
    POMELO_IP_ADDRESSES,
    Genders,
    feeTypes,
    AmountCalculationType,
    Lenguages,
    PomeloTransactionOrigin,
    InternationalCountryCodes,
    DocumentTypes,
    StableMinimumUSD,
    CountryCodesOnly,
    StableServicesFeatures,
    StableActiveCountryCodes,
    StableThirdpartyServices,
    OnePayPaymentEvents,
    OnePayCashoutPaymentEvents,
    d24WebhookCashoutStatus,
    ExpirySeconds,
    FeatureNames,
    StableModelsNames,
    StableMaximumUSD,
    PublicOtpTypes,
    PubSubChannels,
    PrivateOtpTypes,
    businessTypes,
    HubspotCustomerLifecycleStages,
    AppEnviornments,
    CashuotMethodsCategories,
    CashoutCategories,
    SoftBlockTypes,
    PromotionsType,
    CronJobs,
    AiPriseKycStatus,
    AiPriseIdTypes,
    tapiTransactionTypes,
    StableServicesIdTypes,
    TransactionTypes,
    ErrorCodes,
};
