import logger from "../../logger/index.js";

const returnResponse = (status = 500, message = "", service = "Cashin") => {
    const res = {
        status,
        body: {
            success: status === 200,
            service,
            message,
        },
    };
    if (status === 200) logger.info({ service, res });
    else logger.error(service, res);
    return res;
};

export default returnResponse;
