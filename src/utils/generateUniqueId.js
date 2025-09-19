import crypto from "crypto";

let lastNumber = 1;

const generate7digitRandomNumber = () => Math.floor(Math.random() * 9000000) + 1000000;

function generateUniqueId(type) {
    const currentTimestamp = Date.now();
    const sequentialNumber = lastNumber + 1;
    const randomNumber7digit = generate7digitRandomNumber();
    const data = currentTimestamp.toString() + randomNumber7digit + sequentialNumber.toString();
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    const referenceNumber = parseInt(hash.slice(0, 16), 16);
    lastNumber = sequentialNumber;
    if (type === "cashout") {
        const id = `cashout-${referenceNumber.toString().slice(0, 16)}`;
        return id;
    }
    if (type === "cashin") {
        const id = `cashin-${referenceNumber.toString().slice(0, 16)}`;
        return id;
    }
    if (type === "onepay") {
        const id = `onepay-${referenceNumber.toString().slice(0, 16)}`;
        return id;
    }
    if (type === "kushki") {
        const id = `kushki-${referenceNumber.toString().slice(0, 16)}`;
        return id;
    }
    if (type === "finix") {
        const id = `finix-${referenceNumber.toString().slice(0, 16)}`;
        return id;
    }
    if (type === "kushki") {
        const id = `kushki-${referenceNumber.toString().slice(0, 16)}`;
        return id;
    }
    return referenceNumber.toString().slice(0, 16);
}

export default generateUniqueId;
