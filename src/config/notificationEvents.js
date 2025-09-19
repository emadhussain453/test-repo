class NotificationEvents {
    constructor(socket, socketManager) {
        this.socket = socket;
        this.socketManager = socketManager;
        this.superSocket = socketManager;
    }

    handleNotification() {
        this.socket.on("notification", (data) => {
            this.socketManager._emitNotification(this.socket, "Wait i am sending you some notification");
        });
    }

    static sendPushNotifiation() {
        this.superSocket.io.to(this.socket.id).emit("notificationFromServer", { message: "Push notification send" });
    }
}
export default NotificationEvents;
