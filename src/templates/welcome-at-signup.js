const WelcomeAtSignup = (otp, rest = {}) => {
    const html = `<h1>Hello,Welcome to stable app. This is your one time password for email verification: ${otp}</h1>`;
    return html;
};

export default WelcomeAtSignup;
