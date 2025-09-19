import logger from "../logger/index.js";
import deleteFromCache from "../utils/cache/deleteFromCache.js";
import HubsportEvents from "../utils/socket/HubspotEvents.js";
import SocketHelper from "./sockerHelper.js";

function intilizeSocket(io) {
    return (socket) => {
        try {
            SocketHelper.init(io, socket);
            // hubspot events
            const HubsportSocketEvents = new HubsportEvents(socket);
            HubsportSocketEvents.onChat(socket.user);

            socket.on("disconnect", async () => {
                const userEmail = socket.user.email;
                const redisKey = `socket:user:${userEmail}`;
                const redisKeySocketUserData = `socket:user:${userEmail}:data`;
                const userChatting = `${redisKey}:chatting`;

                await deleteFromCache([redisKey, redisKeySocketUserData, userChatting]);
                logger.info(`User disconnected :: ${(socket.id)}`);
            });
        } catch (error) {
            logger.error(error.message);
        }
    };
}

export default intilizeSocket;
