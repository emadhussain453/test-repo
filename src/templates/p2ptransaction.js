const P2pTransactionTemplate = (otp, rest = {}) => {
    const html = `<h1>Hello,Your one-time transaction verification otp is ${otp}. Please dont share this with anyone.</h1>`;
    return html;
};
export default P2pTransactionTemplate;
