const ipAddressMiddleware = (req, res, next) => {
    try {
        const userIpAddress = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip;
        req.userIpAddress = userIpAddress;
        next();
    } catch (error) {
        next(error);
    }
};

export default ipAddressMiddleware;
