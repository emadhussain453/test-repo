import CryptoJS from "crypto-js";
import keys from "../../config/keys.js";
import logger from "../../logger/index.js";

const hashResponseForPomelo = (req, res, responseBody, statusCode) => {
    const body = JSON.stringify(responseBody);
    const endpoint = req.headers["x-endpoint"];
    const timestamp = Math.floor(Date.now() / 1000);
    const secret = CryptoJS.enc.Base64.parse(keys.POMELO.API_SECRET);

    let toEncrypt = timestamp + endpoint;
    if (responseBody) {
        toEncrypt += body;
    }

    const hmacSignature = CryptoJS.HmacSHA256(toEncrypt, secret);

    res.setHeader("X-Endpoint", endpoint);
    res.setHeader("X-Timestamp", timestamp);
    res.setHeader("X-signature", `hmac-sha256 ${hmacSignature.toString(CryptoJS.enc.Base64)}`);
    if (responseBody) {
        return res.status(statusCode).json(responseBody);
    }
    return res.status(statusCode).end();
};

export default hashResponseForPomelo;
