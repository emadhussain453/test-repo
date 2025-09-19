const ForgetPasswordEmail = (otp, rest = {}) => {
    const html = `<h1>Forget password request : your one-time password to reset your password is ${otp} .Note : The one time password will expire in 15 minutes. </h1>`;
    return html;
};

export default ForgetPasswordEmail;
