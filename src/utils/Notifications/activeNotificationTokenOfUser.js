const activeNotificationTokenOfUser = (devices = []) => {
    const notificationTokens = devices?.filter((device) => device.isMainDevice || (device?.notificationStatus && device.loginStatus)).map((device) => device?.notificationToken);
    return notificationTokens;
};
export default activeNotificationTokenOfUser;
