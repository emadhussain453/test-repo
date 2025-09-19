import moment from "moment";
import crypto from "crypto-js";
import ENV from "../../config/keys.js";

const createAuthHash = (apibody) => {
    const currentDate = moment().utc().format();
    const Direct24Login = ENV.DIRECTA_24.LOGIN;
    const Direct24Secret = ENV.DIRECTA_24.SECRET;
    const stringifyApiBody = JSON.stringify(apibody);

    let data = `${currentDate}${Direct24Login}`;
    if (apibody) {
        data += `${stringifyApiBody}`;
    }
    const hash = crypto.HmacSHA256(data, Direct24Secret).toString();
    const authorization = (`D24 ${hash}`);
    return {
        "X-Login": Direct24Login,
        "X-Date": currentDate,
        Authorization: authorization,
    };
};

export default createAuthHash;
