import { ExpirySeconds } from "../../constants/index.js";
import logger from "../../logger/index.js";
import setToCache from "../cache/setToCache.js";

class HubsportEvents {
    constructor(socket) {
        this.socket = socket;
    }

    onChat(user) {
        this.socket.on("startChat", async (data) => {
            // setuser startChat status to true
            const { email } = user;
            const redisKey = `socket:user:${email}:chatting`;
            const chattingStatus = true;
            const res = await setToCache(redisKey, chattingStatus, ExpirySeconds.m10);
            logger.info(`Email :: ${email} has started chat.`);
        });
    }
}
export default HubsportEvents;
