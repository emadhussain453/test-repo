import dotenv from "dotenv";
import otpGenerator from "../utils/otpGenerator.js";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export default {
    SERVER_UUID: otpGenerator(),
    DOMAIN: process.env.STABLE_DOMAIN,
    STABLE_PAYMENT_LINK_DOMAIN: process.env.STABLE_PAYMENT_LINK_DOMAIN,
    PORT: process.env.PORT,
    DEVELOPER_EMAIL: process.env.DEVELOPER_EMAIL,
    TESTING_DEMO_ACCOUNT_EMAIL: process.env.TESTING_DEMO_ACCOUNT_EMAIL || "test-stable1@maildrop.cc",
    DATABASE: {
        URL: process.env.MONGODB_URL,
    },
    REDIS: {
        HOST: process.env.REDIS_HOST,
        PORT: process.env.REDIS_PORT,
        PASSWORD: process.env.REDIS_PASSWORD,
        DB: process.env.REDIS_DB,
    },
    BUSINESS_REDIS_CLOUD: {
        HOST: process.env.BUSINESS_REDIS_CLOUD_HOST || process.env.REDIS_CLOUD_HOST,
        PORT: process.env.BUSINESS_REDIS_CLOUD_PORT || Number(process.env.REDIS_CLOUD_PORT),
        PASSWORD: process.env.BUSINESS_REDIS_CLOUD_PASSWORD || process.env.REDIS_CLOUD_PASSWORD,
    },
    JWT: {
        SECRET: process.env.JWT_SECRET,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
        APP_VERSION_SECRET: process.env.JWT_SECRET_APP_VERSION,
        TOKEN_EXPIRY: process.env.TOKEN_EXPIRY || "7d",
        REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "1y",
        VERIFY_EMAIL_TOKEN_EXPIRY: "15m",
        ADMIN_SECRET_KEY: process.env.ADMIN_JWT_SECRET,
        ACTIVATE_CARD_SECRET: process.env.ACTIVATE_CARD_JWT_SECRET,
    },
    SENDGRID: {
        API_SECRET: process.env.SENDGRID_API_KEY,
        FROM: process.env.SENDGRID_FROM_EMAIL,
    },
    DIRECTA_24: {
        BASE_URL: process.env.DIRECTA24_BASE_URL,
        BASE_URL_CASHIN_THROUGH_CARD: process.env.DIRECTA24_BASE_URL_CASHIN_CARD,
        BASE_URL_CASHIN_THROUGH_PSE: process.env.DIRECTA24_BASE_URL,
        BASE_URL_VALIDATE: process.env.DIRECTA24_BASE_URL_VALIDATE,
        BASE_URL_CASHOUT: process.env.DIRECTA24_BASE_URL,
        LOGIN: process.env.DIRECTA24_LOGIN,
        SECRET: process.env.DIRECTA24_SECRET,
        API_SIGNATURE: process.env.API_SIGNATURE,
        API_KEY: process.env.API_KEY,
        API_PASS: process.env.API_PASS,
        READ_ONLY_API_KEY: process.env.DIRECTA24_API_KEY_READ_ONLY,
    },
    JUMIO: {
        CLIENT_ID: process.env.JUMIO_CLIENT_ID,
        CLIENT_SECRET: process.env.JUMIO_CLIENT_SECRET,
        AUTH_URL: process.env.JUMIO_AUTH_URL,
    },
    REDIS_CLOUD: {
        HOST: process.env.REDIS_CLOUD_HOST,
        PORT: Number(process.env.REDIS_CLOUD_PORT),
        PASSWORD: process.env.REDIS_CLOUD_PASSWORD,
        USERNAME: process.env.REDIS_CLOUD_USERNAME,
        URL: `redis://${process.env.REDIS_CLOUD_USERNAME}:${process.env.REDIS_CLOUD_PASSWORD}@${process.env.REDIS_CLOUD_HOST}:${process.env.REDIS_CLOUD_PORT}`,
    },
    POMELO: {
        AUTH_URL: process.env.POMELO_AUTH_BASE_URL,
        BASE_URL: process.env.POMELO_BASE_URL,
        CLIENT_ID: process.env.POMELO_CLIENT_ID,
        CLIENT_SECRET: process.env.POMELO_CLIENT_SECRET,
        AUDIENCE: process.env.POMELO_AUDIENCE,
        GRANT_TYPE: process.env.POMELO_GRANT_TYPE,
        VIRTUAL_AFFINITY_GROUP_ID: process.env.POMELO_VIRTUAL_AFFINITY_GROUP_ID,
        PHYSICAL_AFFINITY_GROUP_ID: process.env.POMELO_PHYSICAL_AFFINITY_GROUP_ID,
        SECURE_DATA_URL: process.env.POMELO_SECURE_DATA_URL,
        API_KEY: process.env.POMELO_API_KEY,
        API_SECRET: process.env.POMELO_API_SECRET,
        WHITELIST_IPS: process.env.POMELO_WHITELIST_IP_ADDRESSES,

        // MEXICO KEYS
        MEX_VIRTUAL_AFFINITY_GROUP_ID: process.env.MEX_POMELO_VIRTUAL_AFFINITY_GROUP_ID,
        MEX_PHYSICAL_AFFINITY_GROUP_ID: process.env.MEX_POMELO_PHYSICAL_AFFINITY_GROUP_ID,
    },
    HUPSPOT: {
        BASE_URL: process.env.HUPSPOT_BASE_URL,
        ACCESS_TOKEN: process.env.HUPSPOT_ACCESS_TOKEN,
        MSG_KEY: process.env.HUBSPOT_MSG_KEY,
    },
    ONEPAY: {
        BASE_URL: process.env.ONE_PAY_BASE_URL,
        ACCESS_TOKEN: process.env.ONE_PAY_ACCESS_TOKEN,
        SECRET: process.env.ONE_PAY_SECRET,
        WEB_TOKEN: process.env.ONE_PAY_TOKEN,
        CASHOUT_WEB_TOKEN: process.env.ONE_PAY_CASHOUT_TOKEN,
    },
    FINIX: {
        BASE_URL: process.env.FINIX_BASE_URL,
        ACCESS_TOKEN: process.env.FINIX_TOEKN,
        IDENTITY: process.env.FINIX_IDENTITY,
        MERCHANT: process.env.FINIX_MERCHANT,
        USERNAME: process.env.FINIX_USERNAME,
        PASSWORD: process.env.FINIX_PASSWORD,
    },
    AWS: {
        ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY,
        SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        REGION: process.env.AWS_REGION,
        S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
        CLOUDFRONT_DNS: process.env.AWS_CLOUDFRONT_DISRIBUTION_DNS,
        CLOUDFRONT_DISTRIBUTION_ID: process.env.AWS_CLOUDFRONT_DISRIBUTION_ID,
        SNS_ACCESS_KEY: process.env.SNS_ACCESS_KEY,
        SNS_SECRET_KEY: process.env.SNS_SECRET_KEY,
        SES_ACCESS_KEY: process.env.AWS_SES_ACCESS_KEY,
        SES_SECRET_KEY: process.env.AWS_SES_SECRET_KEY,
        EMAIL: process.env.AWS_FROM_EMAIL,
    },
    STABLE_BUSINESS: {
        API_SIGNATURE: process.env.API_SIGNATURE_KEY_FOR_BUSINESS,
    },
    STABLE_ADMIN: {
        API_SIGNATURE: process.env.API_SIGNATURE_KEY_FOR_ADMIN,
    },
    OPENAI: {
        ASSISTANT_ID: process.env.OPENAI_ASSISTANT_ID,
        ASSISTANT_ID_2: process.env.OPENAI_ASSISTANT_ID_2,
        API_KEY: process.env.OPENAI_API_KEY,
    },
    AiPraise: {
        API_KEY: process.env.AiPraise_API_KEY,
        BASE_URL: process.env.AI_PRISE_BASE_URL,
        CALLBACK_URL: process.env.AI_PRISE_DOCUMENT_CALLBACK_URL,
        DOCUMENT_TEMPLATE_ID: process.env.AI_PRISE_DOCUMENT_TEMPLATE_ID,
    },
    PAYMENT_LINK: {
        EXPIRY: process.env.PAYMENT_LINKS_EXPIRY,
        JWT_SECRET: process.env.PAYMENT_LINKS_JWT_SECRET,
        API_SIGNATURE_KEY_FOR_PAYMENT_LINK: process.env.API_SIGNATURE_KEY_FOR_PAYMENT_LINK,
    },
    HMAC: {
        APP_SECRET: process.env.HMAC_ENCRYPTION_KEY,
    },
    SESSION_VALIDATION: {
        SESSION_VALIDATION: process.env.SESSION_VALIDATION,
    },
    KUSKHI: {
        BASE_URL: process.env.KUSHKI_BASE_URL,
        KUSHKI_PUBLIC_KEY: process.env.KUSHKI_CASHOUT_PUBLIC_KEY,
        KUSHKI_PRIVATE_KEY: process.env.KUSHKI_CASHOUT_PRIVATE_KEY,
        KUSHKI_CASHIN_PUBLIC_KEY: process.env.KUSHKI_CASHIN_PUBLIC_KEY,
        KUSHKI_CASHIN_PRIVATE_KEY: process.env.KUSHKI_CASHIN_PRIVATE_KEY,
        CASHIN_WEBHOOK_URL: process.env.KUSHKI_CASHIN_WEBHOOK_URL,
        CASHOUT_WEBHOOK_URL: process.env.KUSHKI_CASHOUT_WEBHOOK_URL,
    },
};
