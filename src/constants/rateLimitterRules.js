import { ExpirySeconds } from "./index.js";

const p2pBaseUrl = "/api/v1/transfer";
const authBaseUrl = "/api/v1/auth";
const paymentBaseURL = "/api/v1/payment";
const paymentBaseURLV2 = "/api/v2/payment";
const userBaseURL = "/api/v1/user";
const chatBaseUrl = "/api/v1/chat";
const communityBaseUrl = "/api/v1/communities";
const cardBaseUrl = "/api/v1";
const onePayBaseUrl = "/api/v1/onepay";
const paymentLink = "/api/v1/payment_links";
const onePayKushkiBaseUrl = "/api/v1/onepay-kushki";
const kushkiBaseUrl = "/api/v1/kushki/cashin";

const RateLimitterRules = Object.freeze({
    [`${paymentLink}/initiate_payment`]: Object.freeze({ endpoint: "initiate_payment", method: "POST", rateLimit: { time: ExpirySeconds.s1, limit: 3, blockDuration: ExpirySeconds.s1 } }),
    [`${cardBaseUrl}/card`]: Object.freeze({ endpoint: "card", method: "POST", rateLimit: { time: ExpirySeconds.s1, limit: 1, blockDuration: ExpirySeconds.s1 }, checkQuery: true }),
    [`${cardBaseUrl}/card/reorder`]: Object.freeze({ endpoint: "reorder", method: "POST", rateLimit: { time: ExpirySeconds.s1, limit: 1, blockDuration: ExpirySeconds.s1 } }),
    [`${p2pBaseUrl}/e-statement`]: Object.freeze({ endpoint: "e-statement", method: "POST", rateLimit: { time: ExpirySeconds.m10, limit: 2, blockDuration: ExpirySeconds.m15 } }),
    [`${p2pBaseUrl}/`]: Object.freeze({ endpoint: "/", method: "POST", rateLimit: { time: ExpirySeconds.s1, limit: 1, blockDuration: ExpirySeconds.s3 } }),
    [`${authBaseUrl}/signup`]: Object.freeze({ endpoint: "signup", method: "POST", rateLimit: { time: ExpirySeconds.m1, limit: 5, blockDuration: ExpirySeconds.m15 } }),
    [`${authBaseUrl}/signin`]: Object.freeze({ endpoint: "signin", method: "POST", rateLimit: { time: ExpirySeconds.m1, limit: 5, blockDuration: ExpirySeconds.m15 } }),
    [`${authBaseUrl}/verify-otp`]: Object.freeze({ endpoint: "publicVerifyOtp", method: "POST", rateLimit: { time: ExpirySeconds.m1, limit: 20, blockDuration: ExpirySeconds.m10 } }),
    [`${authBaseUrl}/forget-password`]: Object.freeze({ endpoint: "forget-password", method: "POST", rateLimit: { time: ExpirySeconds.m15, limit: 5 } }),
    [`${authBaseUrl}/reset-password`]: Object.freeze({ endpoint: "reset-password", method: "POST", rateLimit: { time: ExpirySeconds.s30, limit: 5 } }),
    [`${authBaseUrl}/password`]: Object.freeze({ endpoint: "reset-password-app", method: "POST", rateLimit: { time: ExpirySeconds.m1, limit: 5 } }),
    [`${authBaseUrl}/password/verify`]: Object.freeze({ endpoint: "verify-password", method: "POST", rateLimit: { time: ExpirySeconds.m1, limit: 5 } }),
    [`${paymentBaseURL}/cashin/dynamic`]: Object.freeze({ endpoint: "dynamic", method: "POST", rateLimit: { time: 3, limit: 1, blockDuration: ExpirySeconds.s30 } }),
    [`${paymentBaseURLV2}/cashout`]: Object.freeze({ endpoint: "cashout", method: "POST", rateLimit: { time: 3, limit: 1, blockDuration: ExpirySeconds.s30 } }),
    [`${userBaseURL}/passcode/verify`]: Object.freeze({ endpoint: "verifyPasscode", method: "POST", rateLimit: { time: ExpirySeconds.m1, limit: 10, blockDuration: ExpirySeconds.m15 } }),
    [`${chatBaseUrl}/ai`]: Object.freeze({ endpoint: "ai", method: "POST", rateLimit: { time: ExpirySeconds.m1, limit: 30, blockDuration: ExpirySeconds.m30 } }),
    [`${communityBaseUrl}/join`]: Object.freeze({ endpoint: "/join", method: "POST", rateLimit: { time: ExpirySeconds.s1, limit: 1, blockDuration: ExpirySeconds.s30 } }),
    [`${communityBaseUrl}/unjoin`]: Object.freeze({ endpoint: "/unjoin", method: "POST", rateLimit: { time: ExpirySeconds.s1, limit: 1, blockDuration: ExpirySeconds.s30 } }),
    [`${onePayBaseUrl}/cashin`]: Object.freeze({ endpoint: "/cashin", method: "POST", rateLimit: { time: ExpirySeconds.h1, limit: 5, blockDuration: ExpirySeconds.h3 } }),
    [`${onePayKushkiBaseUrl}/cashin`]: Object.freeze({ endpoint: "/cashin", method: "POST", rateLimit: { time: ExpirySeconds.h1, limit: 5, blockDuration: ExpirySeconds.h3 } }),
    [`${kushkiBaseUrl}/cash`]: Object.freeze({ endpoint: "/cash", method: "POST", rateLimit: { time: ExpirySeconds.h1, limit: 5, blockDuration: ExpirySeconds.h3 } }),
});

export default RateLimitterRules;
