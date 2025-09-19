/* eslint-disable import/no-extraneous-dependencies */
import cluster from "cluster";
import os from "os";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server as SocketServer } from "socket.io";
import AppRoutes from "./src/routes/index.js";
import AppRoutesV2 from "./src/routes/v2/index.js";
import app from "./src/middlewares/appRouteMiddlewares.js";
import ENV from "./src/config/keys.js";
import print from "./src/utils/print.js";
import "./src/jobs/rotateApiLogger.js";
import "./src/jobs/index.js";
import DB from "./src/config/db.js";
import "./src/middlewares/useBullBoard.js";
import Webhooks from "./src/routes/webhooks.js";
import WebhooksOther from "./src/routes/webhooksOthers.js";
import prefillDatabase from "./src/config/hydrateDatabase.js";
import socketAuthMiddleware from "./src/middlewares/socketAuthentication.js";
import intilizeSocket from "./src/config/socketio.js";
import { globalErrorHandlerMiddleware, handleApiNotFound, handleSIGINT, handleUncaughtException } from "./src/utils/globalErrorHandlers.js";
import { PusblisherRedisClient, SubscriberRedisClient } from "./src/pubsub/subscribers.js";
import SocketHelper from "./src/config/sockerHelper.js";

const production = false;
if (cluster.isPrimary && process.env.NODE_ENV === "production" && production) {
    const cpus = os.cpus().length;
    print("info", `Forking for ${cpus} CPUs`);

    // run nodejs on all cpus available on the System
    for (let i = 0; i < cpus; i++) {
        cluster.fork();
    }

    // respawn a new worker if one dies
    cluster.on("exit", (worker) => {
        print("info", `worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    // helloo
    const dateDeployed = `${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
    app.get("/", (req, res) => {
        res.send(`Welcome_hello_blue_green__v3 to Stable API (${process.env.NODE_ENV})  LDA : ${dateDeployed} . Hello from worker: ${process.pid} :blue-green`);
    });

    // apis
    app.use("/api/", Webhooks);
    app.use("/api/v1/", AppRoutes);
    app.use("/api/v2/", AppRoutesV2);
    app.use("/webhooks/", WebhooksOther);

    // route not found
    app.use(handleApiNotFound);

    // error handler
    app.use(globalErrorHandlerMiddleware);

    // uncaughtException and unhandledRejection
    process.on("uncaughtException", handleUncaughtException);
    process.on("unhandledRejection", handleUncaughtException);

    // If node exits, terminate mongoose connection
    process.on("SIGINT", handleSIGINT);
    const STABLE_SERVER = app.listen(ENV.PORT, async () => {
        print("info", `Stable is running on port ${ENV.PORT}...`);
        print("info", `This is ${process.env.NODE_ENV} environment...`);
        DB();
        await prefillDatabase();
    });

    const io = new SocketServer(STABLE_SERVER, { cors: { origin: "*" } });
    // io.of("/live-updates").on("connection", (socket) => {})
    SocketHelper.init(io);
    io.adapter(createAdapter(PusblisherRedisClient, SubscriberRedisClient));
    io.use(socketAuthMiddleware); // middleware to validate user
    io.on("connection", intilizeSocket(io));
}

// test github actions
