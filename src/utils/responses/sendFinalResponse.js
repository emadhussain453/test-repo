const sendFinalResponse = (res, status, success, message, type, results) => res.status(status).json({ status, success, message, type, results });
export default sendFinalResponse;
