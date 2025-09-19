import moment from "moment";
import CryptoJS from "crypto-js";
import ENV from "../../config/keys.js";

const headerForCashOut = (data) => {
    const body = JSON.stringify(data);
    const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, ENV.DIRECTA_24.API_SIGNATURE);
    hmac.update(body);
    const hash = hmac.finalize().toString(CryptoJS.enc.Hex);

    return {
        "Payload-Signature": hash,
    };
};

export default headerForCashOut;
