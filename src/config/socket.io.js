import { Server } from "socket.io";
import logger from "../logger/index.js";
import NotificationEvents from "./notificationEvents.js";

function NEW_CONNECTION(socketid) {
    return {
        id: socketid,
        message: "A new Socket client has been connected.",
    };
}

const users = [];
class Socket {
    constructor(server) {
        this.server = server;
        this.io = new Server(server, { cors: { origin: "*" } });
    }

    _emitNotification(socket, message) {
        socket.emit("notification", { message });
    }

    initializeSocket() {
        this.io.on("connection", (socket) => {
            logger.info(NEW_CONNECTION(socket.id));
            // Emit to the new user only
            users.push(socket.id);
            this._emitNotification(socket, "Welcome to stable socket.io world.");

            const notificationEvents = new NotificationEvents(socket, this);
            notificationEvents.handleNotification();

            socket.on("disconnect", () => {
                logger.info(`Connection ${socket.id} has disconnected`);
            });
        });
        this.io.on("disconnect", (socket) => {
            logger.info(NEW_CONNECTION(socket.id));
        });
    }

    static sendPushNotifiation(socketId, payload = { pong: "pong" }) {
        this.io.to(socketId).emit("notificationFromServer", payload);
    }

    sendCustomEvent(socketId, payload = { pong: "pong" }, eventName = "notificationFromServer") {
        this.io.to(socketId).emit(eventName, payload);
    }

    static accessSocketFunctions() {
        return {
            sendCustomEvent: this.sendCustomEvent,
            sendPushNotifiation: this.sendCustomEvent,
        };
    }

    static createSocket() {
        const _createSocketInstance = (stableServer) => {
            const socketInstance = new Socket(stableServer);
            return socketInstance.initializeSocket();
        };

        return {
            SocketInstance: _createSocketInstance,
        };
    }
}

export default Socket;
