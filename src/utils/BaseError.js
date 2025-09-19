class BaseError extends Error {
    static name;
    static httpCode;
    static isOperational;
    static description;
    static errorCode;

    constructor(name, httpCode, description, isOperational, errorCode) {
        super(description);
        Object.setPrototypeOf(this, new.target.prototype);

        this.name = name;
        this.httpCode = httpCode;
        this.isOperational = isOperational;
        this.description = description;
        this.errorCode = errorCode;
        Error.captureStackTrace(this);
    }
}

export default BaseError;
