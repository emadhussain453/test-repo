import logger from "../logger/index.js";

class SocketHelper {
    static init(io) {
        this.io = io;
    }
    static pushNotification(socketId, payload = { message: "default" }) {
        if (!socketId) {
            this.io.emit("notification", payload);// emit to every socket connected
            return;
        }
        this.io.to(socketId).emit("notification", payload); // emit to socket with socketId given
    }

    static pushMessage(socketId, payload = { message: "default" }) {
        if (!socketId) {
            return;
        }
        this.io.to(socketId).emit("push-message", payload);
    }

    static updateBalance(socketId, payload = { message: "default" }) {
        if (!socketId) {
            return;
        }
        this.io.to(socketId).emit("balance-update", payload);
    }
}

export default SocketHelper;
