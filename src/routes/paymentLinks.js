import express from "express";
import { createPaymentLink, getPaymentLinkDetails, initiatePayment } from "../controllers/paymentLinks/index.js";
import generalAuthMiddleware from "../middlewares/genericAuthMiddelware.js";
import keys from "../config/keys.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Users from "../models/users.js";
import ipBaseRateLimitter from "../middlewares/ipBaseRateLimitter.js";
import paymentLinkValidationMiddleware from "../middlewares/paymentLinkValidationMiddleware.js";
import requiredFieldsMiddlewareV2 from "../middlewares/requiredFieldsMiddlewareV2.js";
import { createPaymentLinkSchema, initiatePaymentSchema } from "../constants/joiSchemas.js";
import hmacMiddleware from "../middlewares/hmacDecryption.js";

const router = express.Router();

router.route("/")
    .post(hmacMiddleware(), authMiddleware(Users), requiredFieldsMiddlewareV2(createPaymentLinkSchema), createPaymentLink);

router.route("/:plId")
    .get(paymentLinkValidationMiddleware, getPaymentLinkDetails);

router.route("/initiate_payment/:plId")
    .post(ipBaseRateLimitter, paymentLinkValidationMiddleware, requiredFieldsMiddlewareV2(initiatePaymentSchema), initiatePayment);

export default router;
