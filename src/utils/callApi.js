/* eslint-disable import/no-cycle */
import Event from "../Events/databaseLogs.js";
import axios from "../config/axios.js";
import ENV from "../config/keys.js";
import { EventTypes, Status } from "../constants/index.js";
import GetPomeloAccessToken from "./pomelo/getPomeloAccessToken.js";

const callApi = {};
const baseURL = {
    directa24CashInThroughPSE: ENV.DIRECTA_24.BASE_URL_CASHIN_THROUGH_PSE,
    directa24CashInThroughCard: ENV.DIRECTA_24.BASE_URL_CASHIN_THROUGH_CARD,
    directa24CashOut: ENV.DIRECTA_24.BASE_URL_CASHOUT,
    directa24BaseURL: ENV.DIRECTA_24.BASE_URL,
    validateBaseURL: ENV.DIRECTA_24.BASE_URL_VALIDATE,
    pomelo: ENV.POMELO.BASE_URL,
    hubspot: ENV.HUPSPOT.BASE_URL,
    onepay: ENV.ONEPAY.BASE_URL,
    finix: ENV.FINIX.BASE_URL,
    aiPrise: ENV.AiPraise.BASE_URL,
    kushki: ENV.KUSKHI.BASE_URL,
};

const apiEndpoints = {
    createNewInvoice: "api/v3/porders",
    cashinInvoice: "v4/merchant/transaccion",
    cashoutInvoice: "cashout/v1/transfer",
    cashInThorughPSE: "deposits",
    cashInThorughCard: "deposits",
    cashInStatus: "deposits/",
    cashOut: "cashout",
    cashOutStatus: "cashout/status",
    cancelCashOut: "cashout/cancel",
    getExchageRate: "exchange_rates",
    validation: "validate",
    getCashinDepositIdDetails: "deposits",
    getCashoutDetails: "cashout/status",

    // pomelo
    createAccessToken: "/oauth/token",
    users: "/users/v1/",
    cards: "/cards/v1/",
    shipment: "/shipping/v1/",
    secureToken: "/secure-data/v1/token",
    chargebacks: "/chargebacks/v2",
    registerToApplePay: "/token-provisioning/mastercard/apple-pay",

    // hubspot
    startChat: "visitor-identification/v3/tokens/create",
    getMessage: "conversations/v3/conversations/threads/",
    getUser: "conversations/v3/conversations/actors/",
    getUserDetailsFromEmail: "contacts/v1/contact/email/",
    getContactDetails: "crm/v3/objects/contacts/",
    getconversations: "conversations/v3/conversations/threads/",

    // OnePay
    createPayment: "payments",
    onepayCashout: "cashouts",
    onepayChargesPse: "charges/pse",
    createCustomers: "customers",
    createAccount: "accounts",
    deletePayment: "payments/",
    banks: "banks",
    customerAccounts: "customers",
    deleteAcount: "accounts",
    // FINIX
    token: "applications/",
    createIdenity: "identities",
    paymentInstrument: "payment_instruments",
    transfers: "transfers",

    // AI_PRISE
    createUserProfile: "create_user_profile",
    addUserDocument: "add_user_document",
    getUserDocuments: "get_user_documents",
    runCheckUserDocuments: "run_check_on_user_document",
    runUserVerification: "run_verification_for_user_profile_id",
    getVerificatinResult: "get_user_verification_result",
    updateResult: "update_user_profile_result",

    // kushki
    createToken: "transfer/v1/tokens",
    createCashToken: "cash/v1/tokens",
    payoutToken: "payouts/transfer/v1/tokens",
    createCashoutToken: "payouts/cash/v1/tokens",
    createCashoutEffecty: "payouts/cash/v1/init",
    kushkiBanks: "transfer/v1/bankList",
    cashin: "transfer/v1/init",
    cashinEffecty: "cash/v1/charges/init",
    cashout: "payouts/transfer/v1/init",
    createPaymentLink: "smartlink/v2/smart-link",
    getPaymentLink: "smartlink/v2/smart-link",
};

callApi.callDirecta24Api = async (baseurl, requestName, method, body = null, params = null, authHeaders = {}) => {
    let Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}`;
    let headers = {};
    if (params) {
        Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}${params}`;
    }

    if (Object.keys(authHeaders).length > 0) {
        headers = {
            ...authHeaders,
        };
    }

    // add request options to log
    const logObject = {
        date: new Date().toISOString(),
        method,
        requestName,
        url: Url,
        headers,
        body,
    };

    try {
        const config = { method, url: Url, headers };
        if (method.toLowerCase() !== "get") {
            config.data = body;
        }

        const data = await axios(config);

        if ((data.status !== 201 || data.data.payment_info.result === "REJECTED") && (requestName === "cashInThorughPSE" || requestName === "cashInThorughCard")) {
            const errorResponse = {
                success: false,
                message: data.data.payment_info.reason || data.message || "error while creating cashInThroughPSE OR cashInThorughCard",
            };
            return errorResponse;
        }

        if (data.status !== 200 && (requestName === "cashOut" || requestName === "cashOutStatus" || requestName === "cancelCashOut")) {
            const errorResponse = {
                success: false,
                message: data.message,
            };
            return errorResponse;
        }

        // add response obj to log
        logObject.response = data.data;
        logObject.status = Status.SUCCESS;
        Event.emit(EventTypes.beckEndLogs, logObject);

        const successResponse = {
            success: true,
            results: data.data || data.statusText,
        };
        return successResponse;
    } catch (error) {
        logObject.response = error.response.data;
        logObject.status = Status.FAILED;
        Event.emit(EventTypes.beckEndLogs, logObject);
        const errorResponse = {
            success: false,
            message: error.response.data.description || error.response.data.message || error.message,
        };
        return errorResponse;
    }
};

callApi.pomelo = async (baseUrl, requestName, method, body = null, params = null, auth = true, userAuthToken = false) => {
    let Url = `${baseURL[baseUrl]}${apiEndpoints[requestName]}`;
    const headers = {
        "Content-Type": "application/json",
    };

    if (params) {
        Url = `${baseURL[baseUrl]}${apiEndpoints[requestName]}${params}`;
    }
    if (auth) {
        const token = await GetPomeloAccessToken();
        headers.Authorization = `Bearer ${token}`;
    }
    if (userAuthToken) {
        headers.Authorization = `Bearer ${userAuthToken}`;
    }

    // add request options to log
    const logObject = {
        date: new Date().toISOString(),
        method,
        requestName,
        url: Url,
        headers,
        body,
    };
    try {
        const config = { method, url: Url, data: body, headers };
        const data = await axios(config);
        const successResponse = {
            success: true,
            results: data.data,
        };
        // add response obj to log
        logObject.response = data.data;
        logObject.status = Status.SUCCESS;
        Event.emit(EventTypes.beckEndLogs, logObject);
        return successResponse;
    } catch (error) {
        logObject.response = error.response.data;
        logObject.status = Status.FAILED;
        Event.emit(EventTypes.beckEndLogs, logObject);
        const errorResponse = {
            success: false,
            message: error.message || error?.response?.data?.error?.details[0]?.detail || error?.response?.data?.title || error?.response?.data?.errorDescription || error?.response,
            status: error.response.data.status,
        };
        return errorResponse;
    }
};

callApi.hubspot = async (baseurl, requestName, method, body = null, params = null, auth = true) => {
    let Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}`;
    let headers = {};

    if (params) {
        Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}${params}`;
    }

    if (auth) {
        headers = {
            ...headers,
            Authorization: `Bearer ${ENV.HUPSPOT.ACCESS_TOKEN}`,
        };
    }

    // add request options to log
    const logObject = {
        date: new Date().toISOString(),
        method,
        requestName,
        url: Url,
        headers,
        body,
    };
    try {
        const config = { method, url: Url, data: body, headers };
        const data = await axios(config);

        // add response obj to log
        logObject.response = data.data;
        logObject.status = Status.SUCCESS;
        Event.emit(EventTypes.beckEndLogs, logObject);

        const successResponse = {
            success: true,
            results: data.data,
        };
        return successResponse;
    } catch (error) {
        logObject.response = error.response.data;
        logObject.status = Status.FAILED;
        Event.emit(EventTypes.beckEndLogs, logObject);
        const errorResponse = {
            success: false,
            message: error.response.data.details || error.response.data.title || error.message,
            status: error.response.data.status,
        };
        return errorResponse;
    }
};
callApi.onepay = async (baseurl, requestName, method, body = null, params = null, authHeaders = {}) => {
    let Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}`;
    let headers = {};

    if (params) {
        Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}${params}`;
    }

    if (authHeaders) {
        headers = {
            ...authHeaders,
            Authorization: `Bearer ${ENV.ONEPAY.ACCESS_TOKEN}`,
        };
    }

    // add request options to log
    const logObject = {
        date: new Date().toISOString(),
        method,
        requestName,
        url: Url,
        headers,
        body,
    };
    try {
        const config = { method, url: Url, data: body, headers };
        const data = await axios(config);
        // add response obj to log
        logObject.response = data.data;
        logObject.status = Status.SUCCESS;
        Event.emit(EventTypes.beckEndLogs, logObject);

        const successResponse = {
            success: true,
            results: data.data,
        };
        return successResponse;
    } catch (error) {
        logObject.response = error.response.data;
        logObject.status = Status.FAILED;
        Event.emit(EventTypes.beckEndLogs, logObject);
        const errorResponse = {
            success: false,
            message: error.response.data.message || error.message,
            status: error.response.status,
        };
        return errorResponse;
    }
};
callApi.Finix = async (baseurl, requestName, method, body = null, params = null, authHeaders = {}) => {
    let Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}`;
    let headers = {};

    if (params) {
        Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}${params}`;
    }

    if (authHeaders) {
        headers = {
            ...authHeaders,
            Authorization: `Basic ${ENV.FINIX.ACCESS_TOKEN}`,
        };
    }

    // add request options to log
    const logObject = {
        date: new Date().toISOString(),
        method,
        requestName,
        url: Url,
        headers,
        body,
    };
    try {
        const config = { method, url: Url, data: body, headers };
        const data = await axios(config);
        // add response obj to log
        if ((data.status !== 201 || data.data.state !== "SUCCEEDED") && (requestName === "transfers")) {
            const errorResponse = {
                success: false,
                message: data.data.failure_message || data.message || "error while creating payment",
            };
            logObject.response = data.data;
            logObject.status = data.data?.state;
            Event.emit(EventTypes.beckEndLogs, logObject);
            return errorResponse;
        }
        logObject.response = data.data;
        logObject.status = Status.SUCCESS;
        Event.emit(EventTypes.beckEndLogs, logObject);
        const successResponse = {
            success: true,
            results: data.data,
        };
        return successResponse;
    } catch (error) {
        logObject.response = error.response.data._embedded.errors[0] || error.response.data;
        logObject.status = Status.FAILED;
        Event.emit(EventTypes.beckEndLogs, logObject);
        const errorResponse = {
            success: false,
            message: error.response.data._embedded.errors[0].message || error.response.data.message || error.message,
            status: error.response.status,
        };
        return errorResponse;
    }
};
callApi.hubspotMsg = async (baseurl, requestName, method, body = null, params = null, auth = false, query = null) => {
    let Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}`;
    const headers = {};
    if (auth) {
        headers.Authorization = `Bearer ${auth}`;
    }
    if (params) {
        Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}/${params}`;
    }
    if (query) {
        const encodedQuery = Object.keys(query)
            .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
            .join("&");
        Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}?${encodedQuery}`;
    }
    try {
        const config = { method, url: Url, headers, data: body };
        const data = await axios(config);
        const successResponse = {
            success: true,
            results: data.data,
        };
        return successResponse;
    } catch (error) {
        const errorResponse = {
            success: false,
            message: error.response?.data?.message,
            status: error.response?.status,
        };
        return errorResponse;
    }
};

// AiPrise api
callApi.AiPrise = async (baseurl, requestName, method, body = null, params = null, authHeaders = {}) => {
    let Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}`;
    let headers = {};

    if (params) {
        Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}${params}`;
    }
    if (authHeaders) {
        headers = {
            "X-API-KEY": ENV.AiPraise.API_KEY,
            ...authHeaders,
        };
    }

    // add request options to log
    const logObject = {
        date: new Date().toISOString(),
        method,
        requestName,
        url: Url,
        headers,
        body,
    };
    try {
        const config = { method, url: Url, headers };
        if (body) config.data = body;
        const data = await axios(config);
        // add response obj to log
        logObject.response = data.data;
        logObject.status = Status.SUCCESS;
        Event.emit(EventTypes.beckEndLogs, logObject);

        const successResponse = {
            success: true,
            results: data.data,
        };
        return successResponse;
    } catch (error) {
        const errorMessage = error.response?.data?.description || error.response?.data;
        const errorStatus = error.response?.status;
        logObject.response = errorMessage;
        logObject.status = Status.FAILED;
        Event.emit(EventTypes.beckEndLogs, logObject);
        const errorResponse = {
            success: false,
            message: errorMessage,
            status: errorStatus,
        };
        return errorResponse;
    }
};

// kushki
callApi.kushki = async (baseurl, requestName, method, body = null, params = null, authHeaders = {}) => {
    let Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}`;
    let headers = {};

    if (params) {
        Url = `${baseURL[baseurl]}${apiEndpoints[requestName]}${params}`;
    }

    if (Object.keys(authHeaders).length > 0) {
        headers = {
            ...authHeaders,
        };
    }

    // add request options to log
    const logObject = {
        date: new Date().toISOString(),
        method,
        requestName,
        url: Url,
        headers,
        body,
    };
    try {
        const config = { method, url: Url, data: body === null ? undefined : body, headers };
        const data = await axios(config);

        // add response obj to log
        logObject.response = data.data;
        logObject.status = Status.SUCCESS;
        Event.emit(EventTypes.beckEndLogs, logObject);

        const successResponse = {
            success: true,
            results: data.data,
        };
        return successResponse;
    } catch (error) {
        logObject.response = error.response.data;
        logObject.status = Status.FAILED;
        Event.emit(EventTypes.beckEndLogs, logObject);
        const errorResponse = {
            success: false,
            message: error.response.data.message || error.message,
            status: error.response.status,
        };
        return errorResponse;
    }
};
export default callApi;
