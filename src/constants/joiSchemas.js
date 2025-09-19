import Joi from "joi";
import { COLOMBIAN_PHONE_NUMBER_REGEX, CITY_REGION_REGEX, ZIPCODE_REGEX, COUNTRY_CODE_REGEX, DATE_OF_BIRTH_REGEX, NAME_REGEX, PASSWORD_REGEX, PASS_CODE_REGEX, USERNAME_REGEX, NUMBER_REGEX } from "./regex.js";
import { CountryCodes, CountryCodesOnly } from "./index.js";

const ReusableSchemas = {
    phoneNumberSchema: Joi.string().trim().regex(NUMBER_REGEX).min(10)
        .max(20)
        .required()
        .messages({
            "string.empty": "phone_number_empty",
            "string.trim": "phone_number_trim",
            "string.min": "phone_number_min",
            "string.max": "phone_number_max",
            "string.pattern.base": "phone_number_invalid_input",
        }),
    amountSchema: Joi.number()
        .positive()
        .strict(true)
        .required()
        .messages({
            "any.required": "amount_required",
            "number.base": "invalid_amount_type",
            "number.positive": "amount_negative",
        }),

    otpSchema: Joi.number().integer()
        .positive()
        .strict(true)
        .required()
        .messages({
            "any.required": "otp_required",
            "number.base": "invalid_otp_type",
            "number.positive": "otp_negetive",
            "number.integer": "otp_integer",
        }),
    otpOptinalSchema: Joi.number().integer()
        .positive()
        .optional()
        .strict(true)
        .messages({
            "number.base": "invalid_otp_type",
            "number.positive": "otp_negetive",
            "number.integer": "otp_integer",
        }),
    countryCodeSchema: Joi.string().trim().regex(COUNTRY_CODE_REGEX)
        .messages({
            "string.min": "country_code_min",
            "string.base": "country_code_type_string",
            "string.max": "country_code_max",
            "any.only": "country_code_invalid",
        }),

    genaricStringSchema: Joi.string().trim().min(3).max(256)
        .messages(),
};

const CreateUserSchema = Joi.object().options({ abortEarly: false }).keys({
    email: Joi.string().lowercase().trim().email()
        .required()
        .messages({
            "any.required": "email_required",
            "string.base": "email_type_string",
            "string.email": "invalid_email",
            "string.trim": "email_trim", // seems to be unnecessary
            "string.empty": "email_empty",
        }),
    firstName: Joi.string().lowercase().trim().regex(NAME_REGEX)
        .min(2)
        .max(75)
        .required()
        .messages({
            "any.required": "first_name_required",
            "string.base": "first_name_type_string",
            "string.trim": "first_name_trim", // seems to be unnecessary
            "string.empty": "first_name_empty",
            "string.pattern.base": "first_name_invalid_input",
        }),
    lastName: Joi.string().lowercase().trim().regex(NAME_REGEX)
        .min(2)
        .max(75)
        .required()
        .messages({
            "any.required": "last_name_required",
            "string.base": "last_name_type_string",
            "string.trim": "last_name_trim", // seems to be unnecessary
            "string.empty": "last_name_empty",
            "string.min": "last_name_min",
            "string.max": "last_name_max",
            "string.pattern.base": "last_name_invalid_input",
        }),
    dateOfBirth: Joi.string().trim().regex(DATE_OF_BIRTH_REGEX)
        .messages({
            "any.required": "dob_required",
            "string.base": "dob_type_string",
            "string.empty": "dob_empty",
            "string.pattern.base": "dob_invalid_input",
        }),
    password: Joi.string().trim().min(8)
        .max(50)
        .regex(PASSWORD_REGEX)
        .required()
        .messages({
            "any.required": "password_required",
            "string.base": "password_type_string",
            "string.trim": "password_trim", // seems to be unnecessary
            "string.empty": "password_empty",
            "string.min": "password_min",
            "string.max": "password_max",
            "string.pattern.base": "password_is_weak",
        }),
    confirmPassword: Joi.string().trim().valid(Joi.ref("password"))
        .required()
        .messages({
            "any.only": "confirm_password_not_match",
            "any.required": "confirm_password_required",
            "string.base": "confirm_password_type_string",
            "string.trim": "confirm_password_trim",
        }),
    phoneNumber: Joi.string().trim().regex(NUMBER_REGEX).min(10)
        .max(20)
        .required()
        .messages({
            "any.required": "phone_number_required",
            "string.base": "phone_number_type_string",
            "string.empty": "phone_number_empty",
            "string.trim": "phone_number_trim",
            "string.min": "phone_number_min",
            "string.max": "phone_number_max",
            "string.pattern.base": "phone_number_invalid_input",
        }),
    countryCode: Joi.string().required().trim().regex(COUNTRY_CODE_REGEX)
        .min(3)
        .messages({
            "any.required": "country_code_required",
            "string.min": "country_code_min",
            "string.base": "country_code_type_string",
            "string.max": "country_code_max",
            "any.only": "country_code_invalid",
        }),
    gender: Joi.string().optional().messages({
        "string.base": "gender_type_string",
        "string.empty": "gender_empty",
    }),
    deviceId: Joi.string().trim()
        // .required()
        .messages({
            // "any.required": "deviceId_required",
            "string.empty": "deviceId_empty",
            "string.base": "device_id_type_string",
            "string.trim": "deviceId_trim",
        }),
    deviceOS: Joi.string().trim()
        // .required()
        .messages({
            // "any.required": "deviceOS_required",
            "string.empty": "deviceOS_empty",
            "string.base": "device_os_type_string",
            "string.trim": "deviceOS_trim",
        }),
    deviceModel: Joi.string().trim()
        // .required()
        .messages({
            // "any.required": "device_model_required",
            "string.empty": "device_model_empty",
            "string.base": "device_model_type_string",
            "string.trim": "device_model_trim",
        }),
    notificationToken: Joi.string().trim()
        .messages({
            "string.empty": "notification_token_empty",
            "string.base": "notification_token_type_string",
            "string.trim": "notification_token_trim",
        }),
});

const addressSchema = Joi.object().options({ abortEarly: false }).keys({
    streetName: Joi.string().trim().required()
        .messages({
            "any.required": "street_name_required",
            "string.base": "street_name_type_string",
            "string.trim": "street_name_trim", // seems to be unnecessary
            "string.empty": "street_name_empty",
        }),
    city: Joi.string().trim().regex(CITY_REGION_REGEX).min(3)
        .max(45)
        .required()
        .messages({
            "any.required": "city_required",
            "string.base": "city_type_string",
            "string.trim": "city_trim", // seems to be unnecessary
            "string.empty": "city_empty",
            "string.min": "city_min",
            "string.max": "city_max",
            "string.pattern.base": "city_invalid_input",
        }),

    region: Joi.string().trim().regex(CITY_REGION_REGEX).min(3)
        .max(250)
        .required()
        .messages({
            "any.required": "region_required",
            "string.base": "region_type_string",
            "string.trim": "region_trim", // seems to be unnecessary
            "string.empty": "region_empty",
            "string.min": "region_min",
            "string.max": "region_max",
            "string.pattern.base": "region_invalid_input",
        }),
    zipCode: Joi.string().trim().regex(ZIPCODE_REGEX).min(5)
        .max(5)
        .required()
        .messages({
            "any.required": "zipcode_required",
            "string.base": "zip_code_type_string",
            "string.trim": "zipcode_trim", // seems to be unnecessary
            "string.empty": "zipcode_empty",
            "string.min": "zipcode_min",
            "string.max": "zipcode_max",
            "string.pattern.base": "zipcode_invalid_input",
        }),
    countryCode: Joi.string().uppercase().trim().valid(CountryCodesOnly.COL, CountryCodesOnly.MEX)
        .min(3)
        .max(3)
        .required()
        .messages({
            "any.required": "country_code_required",
            "string.base": "country_code_type_string",
            "string.trim": "country_code_trim", // seems to be unnecessary
            "string.empty": "country_code_empty",
            "string.max": "country_code_max",
            "string.min": "country_code_min",
            "string.pattern.base": "country_code_invalid_input",
        }),
    country: Joi.string().lowercase().trim().valid("colombia", "mexico")
        .max(30)
        .required()
        .messages({
            "any.required": "country_required",
            "string.base": "country_type_string",
            "string.trim": "country_trim", // seems to be unnecessary
            "string.empty": "country_empty",
            "string.max": "country_max",
            "any.only": "country_invalid",
        }),
    streetNumber: Joi.string().trim().messages({ "string.empty": "street_number_empty", "string.base": "street_number_type_string" }), // not allowed to be empty
    apartment: Joi.string().trim().max(40).messages({ "string.empty": "apartment_empty", "string.max": "apartment_max", "string.base": "apartment_type_string" }),
    neighborhood: Joi.string().trim().messages({ "string.empty": "neighhborhood_empty", "string.base": "neighborhood_type_string" }),
    floor: Joi.string().trim().messages({ "string.empty": "floor_empty", "string.base": "floor_type_string" }),
    additionalInfo: Joi.string().trim().messages({ "string.empty": "additional_info_empty", "string.base": "addition_info_type_string" }),
}).unknown(false);

const CreateUserOnPomeloAddressSchema = Joi.object().options({ abortEarly: false }).keys({
    address: addressSchema,
});

const initiatePaymentSchema = Joi.object({
    payerPersonalDetails: Joi.object({
        firstName: Joi.string().required().messages({
            "string.base": "First_name_must_be_string",
            "any.required": "First_name_is_required",
            "string.empty": "First_name_cannot_be_empty",
        }),
        lastName: Joi.string().required().messages({
            "string.base": "Last_name_must_be_string",
            "any.required": "Last_name_is_required",
            "string.empty": "Last_name_cannot_be_empty",
        }),
        email: Joi.string().email().required().messages({
            "string.email": "Email_must_be_valid",
            "any.required": "Email_is_required",
            "string.empty": "Email_cannot_be_empty",
        }),
        documentIdNumber: Joi.string().required().messages({
            "string.base": "Document_ID_number_must_be_string",
            "any.required": "Document_ID_number_is_required",
            "string.empty": "Document_ID_number_cannot_be_empty",
        }),
        documentType: Joi.string().required().messages({
            "string.base": "Document_type_must_be_string",
            "any.required": "Document_type_is_required",
            "string.empty": "Document_type_cannot_be_empty",
        }),
    }).required().messages({
        "any.required": "Payer_personal_details_are_required",
    }),

    payerPaymentDetails: Joi.object({
        countryCode: Joi.string().valid("COL", "MEX").required().messages({
            "any.only": "Country_code_must_be_COL_or_MEX",
            "any.required": "Country_code_is_required",
            "string.empty": "Country_code_cannot_be_empty",
        }),
        paymentMethod: Joi.string().required().messages({
            "string.base": "Payment_method_must_be_string",
            "any.required": "Payment_method_is_required",
            "string.empty": "Payment_method_cannot_be_empty",
        }),
    }).required().messages({
        "any.required": "Payer_payment_details_are_required",
    }),
});

const createPaymentLinkSchema = Joi.object().options({ abortEarly: false }).keys({
    amount: Joi.number()
        .positive()
        .strict(true)
        .precision(2)
        .required()
        .messages({
            "any.required": "amount_required",
            "number.precision": "cannot_enter_more_than_two_decimal_digits",
            "number.base": "invalid_amount_type",
            "number.positive": "amount_negative",
        }),
    description: Joi.string().trim().required()
        .messages({
            "any.required": "description_required",
            "string.empty": "description_empty",
            "string.trim": "description_trim",
        }),
}).unknown(false);

const p2pTransactionSchema = Joi.object().options({ abortEarly: false }).keys({
    phoneNumber: ReusableSchemas.phoneNumberSchema,
    otp: ReusableSchemas.otpOptinalSchema,
    amount: ReusableSchemas.amountSchema,
    description: ReusableSchemas.genaricStringSchema,
    countryCode: ReusableSchemas.countryCodeSchema,
});

const SignInSchema = Joi.object().options({ abortEarly: false }).keys({
    email: Joi.string().lowercase().trim().email()
        .required()
        .messages({
            "any.required": "email_required",
            "string.base": "email_type_string",
            "string.email": "invalid_email",
            "string.trim": "email_trim", // seems to be unnecessary
            "string.empty": "email_empty",
        }),
    password: Joi.string().trim()
        .required()
        .messages({
            "any.required": "password_required",
            "string.base": "password_type_string",
            "string.trim": "password_trim", // seems to be unnecessary
            "string.empty": "password_empty",
        }),
    deviceId: Joi.string().trim()
        .messages({
            "any.required": "deviceId_required",
            "string.base": "device_id_type_string",
            "string.empty": "deviceId_empty",
            "string.trim": "deviceId_trim",
        }),
    deviceOS: Joi.string().trim()
        .messages({
            "any.required": "deviceOS_required",
            "string.base": "device_os_type_string",
            "string.empty": "deviceOS_empty",
            "string.trim": "deviceOS_trim",
        }),
    deviceModel: Joi.string().trim()
        .messages({
            "any.required": "device_model_required",
            "string.base": "device_model_type_string",
            "string.empty": "device_model_empty",
            "string.trim": "device_model_trim",
        }),
    notificationToken: Joi.string().trim()
        .messages({
            "string.empty": "notification_token_empty",
            "string.base": "notification_token_type_string",
            "string.trim": "notification_token_trim",
        }),
}).unknown(false);

const onePayCashoutSchema = Joi.object().options({ abortEarly: false }).keys({
    amount: Joi.number()
        .required()
        .messages({
            "any.required": "amount_required",
            "number.base": "amount_type_number",
        }),
    account_id: Joi.string().trim()
        .required()
        .messages({
            "any.required": "account_id_required",
            "string.base": "account_id_type_string",
            "string.empty": "account_id_empty",
            "string.trim": "account_id_trim",
        }),
    bankName: Joi.string().trim()
        .optional()
        .messages({
            "any.required": "bank_name_required",
            "string.base": "bank_name_type_string",
            "string.empty": "bank_name_empty",
            "string.trim": "bank_name_trim",
        }),
    method: Joi.string().trim()
        .optional()
        .messages({
            "string.base": "method_type_string",
            "any.only": "method_invalid_value",
            "string.trim": "method_trim",
        }),
    title: Joi.string().trim()
        .optional()
        .messages({
            "string.base": "title_type_string",
            "string.trim": "method_trim",
        }),
    account_number: Joi.string().trim()
        .optional()
        .messages({
            "any.required": "account_number_required",
            "string.base": "account_number_type_string",
            "string.empty": "account_number_empty",
            "string.trim": "account_number_trim",
        }),
}).unknown(false);

const createOnepayAccountSchema = Joi.object({
    bank_id: Joi.string().trim().required().messages({
        "any.required": "bank_id_required",
        "string.base": "bank_id_type_string",
        "string.empty": "bank_id_empty",
        "string.trim": "bank_id_trim",
    }),

    account_number: Joi.string().trim().required().messages({
        "any.required": "account_number_required",
        "string.base": "account_number_type_string",
        "string.empty": "account_number_empty",
        "string.trim": "account_number_trim",
    }),
    subtype: Joi.string().trim()
        .optional()
        .messages({
            "string.base": "subType_type_string",
            "any.only": "subType_invalid_value",
            "string.trim": "subType_trim",
        }),
});
const onepayCashinSchema = Joi.object({
    bank_id: Joi.string().trim().required().messages({
        "any.required": "bank_id_required",
        "string.base": "bank_id_type_string",
        "string.empty": "bank_id_empty",
        "string.trim": "bank_id_trim",
    }),
    bankName: Joi.string().trim().required().messages({
        "any.required": "bank_name_required",
        "string.base": "bank_name_type_string",
        "string.empty": "bank_name_empty",
        "string.trim": "bank_name_trim",
    }),
    amount: Joi.number()
        .required()
        .messages({
            "any.required": "amount_required",
            "number.base": "amount_type_number",
        }),
});

const VerifyOtpSchema = Joi.object().options({ abortEarly: false }).keys({
    email: Joi.string().lowercase().trim().email()
        .required()
        .messages({
            "any.required": "email_required",
            "string.base": "email_type_string",
            "string.email": "invalid_email",
            "string.trim": "email_trim", // seems to be unnecessary
            "string.empty": "email_empty",
        }),
    type: Joi.string().trim()
        .required()
        .messages({
            "any.required": "type_required",
            "string.base": "type_string",
            "string.trim": "type_trim", // seems to be unnecessary
            "string.empty": "type_empty",
        }),
    // deviceId: Joi.string().trim()
    //     // .required()
    //     .messages({
    //         // "any.required": "deviceId_required",
    //         "string.empty": "deviceId_empty",
    //         "string.trim": "deviceId_trim",
    //     }),
    // deviceOS: Joi.string().trim()
    //     // .required()
    //     .messages({
    //         // "any.required": "deviceOS_required",
    //         "string.empty": "deviceOS_empty",
    //         "string.trim": "deviceOS_trim",
    //     }),
    // deviceModel: Joi.string().trim()
    //     // .required()
    //     .messages({
    //         // "any.required": "device_model_required",
    //         "string.empty": "device_model_empty",
    //         "string.trim": "device_model_trim",
    //     }),
    // notificationToken: Joi.string().trim()
    //     .messages({
    //         "string.empty": "notification_token_empty",
    //         "string.trim": "notification_token_trim",
    //     }),
    otp: Joi.number().integer()
        .positive()
        .strict(true)
        .required()
        .messages({
            "any.required": "otp_required",
            "number.base": "invalid_otp_type",
            "number.positive": "otp_negetive",
            "number.integer": "otp_integer",
        }),
}).unknown(true);

const UserNameSchema = Joi.object().options({ abortEarly: false }).keys({
    userName: Joi.string().trim().regex(USERNAME_REGEX)
        .min(3)
        .max(15)
        .required()
        .messages({
            "any.required": "username_required",
            "string.base": "user_name_type_string",
            "string.trim": "username_trim", // seems to be unnecessary
            "string.empty": "username_empty",
            "string.max": "username_max",
            "string.min": "username_min",
            "string.pattern.base": "invalid_username",
        }),
}).unknown(false);

const PassCodeSchema = Joi.object().options({ abortEarly: false }).keys({
    passCode: Joi.string().trim().regex(PASS_CODE_REGEX)
        .required()
        .messages({
            "any.required": "passcode_required",
            "string.base": "passcode_type_string",
            "string.empty": "passcode_empty",
            "string.pattern.base": "invalid_passcode_format",
        }),
    confirmPassCode: Joi.string().trim().valid(Joi.ref("passCode"))
        .required()
        .messages({
            "any.required": "confirm_passcode_required",
            "string.base": "confirm_passcode_type_string",
            "any.only": "passcodes_not_match",
        }),
}).unknown(false);

const VerifyPassCodeSchema = Joi.object().options({ abortEarly: false }).keys({
    passCode: Joi.string().trim().regex(PASS_CODE_REGEX)
        .required()
        .messages({
            "any.required": "passcode_required",
            "string.empty": "passcode_empty",
            "string.pattern.base": "invalid_passcode_format",
        }),
}).unknown(false);

const UpdateLanguageSchema = Joi.object().options({ abortEarly: false }).keys({
    language: Joi.string().trim().valid("en", "es")
        .required()
        .messages({
            "string.base": "language_type_string",
            "any.required": "language_required",
            "any.only": "language_only",
            "string.empty": "language_empty",
        }),
}).unknown(false);

const ChangePasswordSchema = Joi.object().options({ abortEarly: false }).keys({
    currentPassword: Joi.string().trim()
        .required()
        .messages({
            "any.required": "current_password_required",
            "string.base": "current_password_type_string",
            "string.trim": "current_password_trim", // seems to be unnecessary
            "string.empty": "current_password_empty",
        }),
    newPassword: Joi.string().trim().min(8)
        .max(50)
        .regex(PASSWORD_REGEX)
        .required()
        .messages({
            "any.required": "new_password_required",
            "string.base": "new_password_type_string",
            "string.trim": "new_password_trim", // seems to be unnecessary
            "string.empty": "new_password_empty",
            "string.min": "new_password_min",
            "string.max": "new_password_max",
            "string.pattern.base": "new_password_invalid_input",
        }),
    confirmNewPassword: Joi.string().trim().valid(Joi.ref("newPassword"))
        .required()
        .messages({
            "any.only": "new_confirm_password_not_match",
            "string.base": "confirm_new_password_type_string",
            "any.required": "new_confirm_password_required",
            "string.trim": "new_confirm_password_trim",
        }),
    deviceId: Joi.string().trim().optional()
        .messages({
            "string.base": "device_id_type_string",
            "string.empty": "deviceId_empty",
            "string.trim": "deviceId_trim",
        }),
}).unknown(false);

const VerifyEmailOrPhoneNumberSchema = Joi.object().options({ abortEarly: false }).keys({
    otp: Joi.number().integer()
        .positive()
        .strict(true)
        .required()
        .messages({
            "any.required": "otp_required",
            "number.base": "invalid_otp_type",
            "number.positive": "otp_negetive",
            "number.integer": "otp_integer",
        }),
}).unknown(false);

const ForgetPasswordEmailSchema = Joi.object().options({ abortEarly: false }).keys({
    email: Joi.string().lowercase().trim().email()
        .required()
        .messages({
            "any.required": "email_required",
            "string.base": "email_type_string",
            "string.email": "invalid_email",
            "string.trim": "email_trim", // seems to be unnecessary
            "string.empty": "email_empty",
        }),
}).unknown(false);

const ResetPasswordSchema = Joi.object().options({ abortEarly: false }).keys({
    email: Joi.string().lowercase().trim().email()
        .required()
        .messages({
            "any.required": "email_required",
            "string.base": "email_type_string",
            "string.email": "invalid_email",
            "string.trim": "email_trim", // seems to be unnecessary
            "string.empty": "email_empty",
        }),
    password: Joi.string().trim().regex(PASSWORD_REGEX).min(8)
        .max(50)
        .required()
        .messages({
            "any.required": "password_required",
            "string.base": "password_type_string",
            "string.trim": "password_trim", // seems to be unnecessary
            "string.empty": "password_empty",
            "string.min": "password_min",
            "string.max": "password_max",
            "string.pattern.base": "password_invalid_input",
        }),
    confirmPassword: Joi.string().trim().valid(Joi.ref("password"))
        .required()
        .messages({
            "any.only": "confirm_password_not_match",
            "string.base": "confirm_password_type_string",
            "any.required": "confirm_password_required",
            "string.trim": "confirm_password_trim",
        }),
}).unknown(false);

const PublicResentOtpSchema = Joi.object().options({ abortEarly: false }).keys({
    email: Joi.string().lowercase().trim().email()
        .required()
        .messages({
            "any.required": "email_required",
            "string.base": "email_type_string",
            "string.email": "invalid_email",
            "string.trim": "email_trim", // seems to be unnecessary
            "string.empty": "email_empty",
        }),
    type: Joi.string().trim()
        .required()
        .messages({
            "any.required": "type_required",
            "string.base": "type_string",
            "string.trim": "type_trim", // seems to be unnecessary
            "string.empty": "type_empty",
        }),
}).unknown(false);

const PrivateResentOtpSchema = Joi.object().options({ abortEarly: false }).keys({
    type: Joi.string().trim()
        .required()
        .messages({
            "any.required": "type_required",
            "string.base": "type_string",
            "string.trim": "type_trim", // seems to be unnecessary
            "string.empty": "type_empty",
        }),
}).unknown(false);

const CheckCurrentPasswordSchema = Joi.object().options({ abortEarly: false }).keys({
    currentPassword: Joi.string().trim()
        .required()
        .messages({
            "any.required": "current_password_required",
            "string.base": "current_password_type_string",
            "string.trim": "current_password_trim", // seems to be unnecessary
            "string.empty": "current_password_empty",
        }),
}).unknown(false);

const UploadWorkflowImagesSchema = Joi.object().options({ abortEarly: false }).keys({
    workflowId: Joi.string().trim()
        .required()
        .messages({
            "any.required": "workflowId_required",
            "string.base": "work_flow_id_type_string",
            "string.trim": "workflowId_trim", // seems to be unnecessary
            "string.empty": "workflowId_empty",
        }),
    type: Joi.number().integer().valid(1, 2)
        .required()
        .messages({
            "any.required": "type_required",
            "string.base": "type_string",
            "any.only": "workflow_type_only",
        }),
    front: Joi.string().trim()
        .required()
        .messages({
            "any.required": "front_required",
            "string.base": "front_type_string",
            "string.trim": "front_trim", // seems to be unnecessary
            "string.empty": "front_empty",
        }),
    selfie: Joi.string().trim()
        .required()
        .messages({
            "any.required": "selfie_required",
            "string.base": "selfie_type_string",
            "string.trim": "selfie_trim", // seems to be unnecessary
            "string.empty": "selfie_empty",
        }),
    back: Joi.when(Joi.ref("/type"), {
        is: 2,
        then: Joi.string().trim()
            .required()
            .messages({
                "any.required": "back_required",
                "string.base": "back_type_string",
                "string.trim": "back_trim", // seems to be unnecessary
                "string.empty": "back_empty",
            }),
    }),
    documentNumber: Joi.string().trim()
        .required()
        .messages({
            "any.required": "document_number_required",
            "string.base": "document_number_type_string",
            "string.trim": "document_number_trim", // seems to be unnecessary
            "string.empty": "document_number_empty",
        }),
}).unknown(false);

const reOrderCardAddressSchema = Joi.object().options({ abortEarly: false }).keys({
    isShippingAddressSame: Joi.boolean().required(),
    address: Joi.when(Joi.ref("isShippingAddressSame"), {
        is: false,
        then: addressSchema.required(),
        otherwise: addressSchema,
    }),
}).unknown(false);

const CreateInstrumentSchema = Joi.object().options({ abortEarly: false }).keys({
    token: Joi.string().trim().required()
        .messages({
            "any.required": "token_required",
            "string.base": "token_type_string",
            "string.trim": "token_trim",
            "string.empty": "token_empty",
        }),
    fraudSessionId: Joi.string().trim().required()
        .messages({
            "any.required": "fraud_session_id_required",
            "string.base": "fraud_session_id_type_string",
            "string.trim": "fraud_session_id_trim",
            "string.empty": "fraud_session_id_empty",
        }),
}).unknown(false);

const FinixPaymentSchema = Joi.object().options({ abortEarly: false }).keys({
    instrumentId: Joi.string().trim().required()
        .messages({
            "any.required": "instrumentId_required",
            "string.base": "instrument_id_type_string",
            "string.trim": "instrumentId_trim",
            "string.empty": "instrumentId_empty",
        }),
    amount: Joi.number()
        .positive()
        .strict(true)
        .required()
        .messages({
            "any.required": "amount_required",
            "number.base": "invalid_amount_type",
            "number.positive": "amount_negative",
        }),
}).unknown(false);

const updateAppVersionSchema = Joi.object().options({ abortEarly: false }).keys({
    version: Joi.string().trim().min(7).max(9)
        .required()
        .messages({
            "any.required": "version_required",
            "string.base": "version_type_string",
            "string.trim": "version_trim",
            "string.empty": "version_empty",
            "string.min": "version_min",
            "string.max": "version_max",
        }),
}).unknown(false);

const updateUserDetailsSchema = Joi
    .object()
    .options({ abortEarly: false })
    .keys({
        email: Joi.string().lowercase().trim().email()
            .messages({
                "string.email": "invalid_email",
                "string.trim": "email_trim", // seems to be unnecessary
                "string.empty": "email_empty",
            }),
        firstName: Joi.string().lowercase().trim().regex(NAME_REGEX)
            .min(2)
            .max(75)
            .messages({
                "string.trim": "first_name_trim", // seems to be unnecessary
                "string.empty": "first_name_empty",
                "string.pattern.base": "first_name_invalid_input",
            }),
        lastName: Joi.string().lowercase().trim().regex(NAME_REGEX)
            .min(2)
            .max(75)
            .messages({
                "string.trim": "last_name_trim", // seems to be unnecessary
                "string.empty": "last_name_empty",
                "string.min": "last_name_min",
                "string.max": "last_name_max",
                "string.pattern.base": "last_name_invalid_input",
            }),
        phoneNumber: Joi.string().trim().regex(NUMBER_REGEX).min(10)
            .max(20)
            .messages({
                "string.empty": "phone_number_empty",
                "string.trim": "phone_number_trim",
                "string.min": "phone_number_min",
                "string.max": "phone_number_max",
                "string.pattern.base": "phone_number_invalid_input",
            }),
        dateOfBirth: Joi.string().trim().regex(DATE_OF_BIRTH_REGEX)
            .messages({
                "string.empty": "dob_empty",
                "string.pattern.base": "dob_invalid_input",
            }),
    }).unknown(false);

const deleteDeviceSchema = Joi.object().options({ abortEarly: false }).keys({
    deviceId: Joi.string().trim().required()
        .messages({
            "any.required": "deviceId_required",
            "string.base": "device_id_type_string",
            "string.empty": "deviceId_empty",
            "string.trim": "deviceId_trim",
        }),
    activeDeviceId: Joi.string().trim().required()
        .messages({
            "any.required": "active_deviceId_required",
            "string.base": "active_device_id_type_string",
            "string.empty": "active_deviceId_empty",
            "string.trim": "active_deviceId_trim",
        }),
}).unknown(false);

const changeMainDeviceSchema = Joi.object().options({ abortEarly: false }).keys({
    deviceId: Joi.string().trim().required()
        .messages({
            "any.required": "deviceId_required",
            "string.base": "device_id_type_string",
            "string.empty": "deviceId_empty",
            "string.trim": "deviceId_trim",
        }),
    activeDeviceId: Joi.string().trim().required()
        .messages({
            "any.required": "active_deviceId_required",
            "string.base": "active_device_id_type_string",
            "string.empty": "active_deviceId_empty",
            "string.trim": "active_deviceId_trim",
        }),
    otp: ReusableSchemas.otpSchema,
}).unknown(false);
const allowNotificationSchema = Joi.object().options({ abortEarly: false }).keys({
    deviceId: Joi.string().trim().required()
        .messages({
            "any.required": "deviceId_required",
            "string.base": "device_id_type_string",
            "string.empty": "deviceId_empty",
            "string.trim": "deviceId_trim",
        }),
    notificationToken: Joi.string().trim().required()
        .messages({
            "any.required": "notification_token_required",
            "string.empty": "notification_token_empty",
            "string.base": "notification_token_type_string",
            "string.trim": "notification_token_trim",
        }),
}).unknown(false);
const tutorialSchema = Joi.object().options({ abortEarly: false }).keys({
    home: Joi.boolean(),
    account: Joi.boolean(),
    cards: Joi.boolean(),
}).unknown(false);

const saveIdNumberSchema = Joi.object().options({ abortEarly: false }).keys({
    idNumber: Joi.string().trim().min(3)
        .max(32)
        .required()
        .messages({
            "any.required": "idNumber_number_required",
            "string.base": "idNumber_number_type_string",
            "string.empty": "idNumber_number_empty",
            "string.trim": "idNumber_number_trim",
            "string.min": "idNumber_number_min",
            "string.max": "idNumber_number_max",
            "string.pattern.base": "idNumber_number_invalid_input",
        }),
}).unknown(false);

const addCashoutBeneficiarySchema = Joi.object().options({ abortEarly: false }).keys({
    accountType: Joi.string().trim()
        .messages({
            "any.required": "accountType_required",
            "string.base": "accountType_string",
            "string.empty": "accountType_empty",
            "string.trim": "accountType_trim",
        }),
    address: Joi.string().trim()
        .messages({
            "any.required": "address_required",
            "string.base": "address_string",
            "string.empty": "address_empty",
            "string.trim": "address_trim",
        }),
    bankName: Joi.string().trim().required()
        .messages({
            "any.required": "bankName_required",
            "string.base": "bankName_string",
            "string.empty": "bankName_empty",
            "string.trim": "bankName_trim",
        }),

}).unknown(true);

const updateCashoutBeneficiarySchema = Joi.object().options({ abortEarly: false }).keys({
    beneficiaryId: Joi.string().trim()
        .required()
        .messages({
            "any.required": "beneficiaryId_required",
            "string.base": "beneficiaryId_type_string",
            "string.trim": "beneficiaryId_trim",
            "string.empty": "beneficiaryId_empty",
        }),
    accountType: Joi.string().trim().optional()
        .messages({
            "string.base": "accountType_string",
            "string.empty": "accountType_empty",
            "string.trim": "accountType_trim",
        }),
    address: Joi.string().trim().optional()
        .messages({
            "string.base": "address_string",
            "string.empty": "address_empty",
            "string.trim": "address_trim",
        }),
    bankAccount: Joi.string().trim().optional()
        .messages({
            "string.base": "bankAccount_type_string",
            "string.empty": "bankAccount_empty",
            "string.trim": "bankAccount_trim",
        }),
}).unknown(false);

const CreatePayeeSchema = Joi.object().options({ abortEarly: false }).keys({
    favourite: Joi.boolean().optional().messages({
    }),
    phoneNumber: Joi.string().trim().regex(NUMBER_REGEX).min(10)
        .max(20)
        .required()
        .messages({
            "any.required": "phone_number_required",
            "string.base": "phone_number_type_string",
            "string.empty": "phone_number_empty",
            "string.trim": "phone_number_trim",
            "string.min": "phone_number_min",
            "string.max": "phone_number_max",
            "string.pattern.base": "phone_number_invalid_input",
        }),
});

export {
    CreatePayeeSchema,
    CreateUserSchema,
    SignInSchema,
    VerifyOtpSchema,
    createPaymentLinkSchema,
    UserNameSchema,
    PassCodeSchema,
    UpdateLanguageSchema,
    ChangePasswordSchema,
    addCashoutBeneficiarySchema,
    updateCashoutBeneficiarySchema,
    VerifyEmailOrPhoneNumberSchema,
    ForgetPasswordEmailSchema,
    ResetPasswordSchema,
    PublicResentOtpSchema,
    PrivateResentOtpSchema,
    CheckCurrentPasswordSchema,
    UploadWorkflowImagesSchema,
    CreateUserOnPomeloAddressSchema,
    reOrderCardAddressSchema,
    CreateInstrumentSchema,
    onePayCashoutSchema,
    FinixPaymentSchema,
    updateAppVersionSchema,
    updateUserDetailsSchema,
    VerifyPassCodeSchema,
    deleteDeviceSchema,
    tutorialSchema,
    saveIdNumberSchema,
    createOnepayAccountSchema,
    p2pTransactionSchema,
    onepayCashinSchema,
    initiatePaymentSchema,
    changeMainDeviceSchema,
    allowNotificationSchema,
};
