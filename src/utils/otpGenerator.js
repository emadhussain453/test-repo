const otpGenerator = () => {
    if (process.env.NODE_ENV === "production") {
        return Math.floor(Math.random() * 900000) + 100000;
    }
    return 131821;
};

export default otpGenerator;
