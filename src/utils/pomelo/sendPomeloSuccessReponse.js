import hashResponseForPomelo from "./hashResponseForPomelo.js";

const sendPomeloSuccessReponse = (req, res, reponsePayload) => {
    try {
    const statusCode = 200;
    return hashResponseForPomelo(req, res, reponsePayload, statusCode);
    } catch (err) {
        throw new Error(err.message);
    }
};
export default sendPomeloSuccessReponse;
