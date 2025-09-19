const SigninMessage = (otp, rest = {}) => {
    const html = `<h1>Hello,Your one-time login otp is ${otp}. Please dont share this with anyone.</h1>`;
    return html;
};

export default SigninMessage;
