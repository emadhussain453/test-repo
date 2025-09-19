/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize"; // to prevent sql query attack
import { xss } from "express-xss-sanitizer";
import middleware from "i18next-http-middleware";
import serverAdapter from "./useBullBoard.js";
import { i18next } from "./transalations.js";
import ipAddressMiddleware from "./ipAddressMiddleware.js";
import checkApiMethodStatus from "./checkApiMethodStatus.js";
import globalRateLimiter from "./globalRateLimitter.js";

const app = express();

function restriceAccessToQueuesAdminPage(req, res, next) {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

// will apply to all requests incoming to the app
app.use(middleware.handle(i18next));
app.use(express.json({
  limit: "10mb",
  verify: (req, res, buf) => {
    if (req.path === "/webhooks/kyc/status") {
      req.payloadAsString = buf.toString("utf8");
    }
  },
}));

app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static("public"));
app.use("/images", express.static("images"));
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use((req, res, next) => {
  ["body", "params"].forEach((key) => {
    if (req[key]) {
      req[key] = mongoSanitize.sanitize(req[key]);
    }
  });
  if (req.query) {
    for (const prop in req.query) {
      req.query[prop] = mongoSanitize.sanitize(req.query[prop]);
    }
  }
  next();
}); // must come after express.json()
app.use(xss());
morgan.token("user-ip-address", (req) => req.headers["x-forwarded-for"] || req.ip);
app.use(morgan(":method :url :status :response-time :res[content-length] :user-ip-address :date[iso]", {
  skip: (req, res) => req.url === "/",
}));
app.use(ipAddressMiddleware);
// app.use(globalRateLimiter);
// app.use(checkApiMethodStatus);
app.use("/admin/queues", restriceAccessToQueuesAdminPage, serverAdapter.getRouter());

export default app;
