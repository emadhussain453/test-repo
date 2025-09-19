import express from "express";
import requiredFields from "../middlewares/requiredFieldsMiddleware.js";
import VerifyOtpMiddleware from "../middlewares/verifyOtpMiddleWare.js";
import { arrayofRequiredFields } from "../constants/index.js";
import { makeTransaction, getUser, requestp2pOtp, getTransactions, generateEstatement, getTransactions2 } from "../controllers/transaction/index.js";
import featureBetaAccessMiddleware from "../middlewares/featureBetaAccessMiddleware.js";
import requiredFieldsMiddlewareV2 from "../middlewares/requiredFieldsMiddlewareV2.js";
import { p2pTransactionSchema } from "../constants/joiSchemas.js";
import userBaseRateLimitter from "../middlewares/userBaseRateLimitter.js";

const router = express.Router();

router.get("/request-otp", requestp2pOtp);
router.get("/transactions", getTransactions2);
router.post("/e-statement", userBaseRateLimitter, generateEstatement);
router.post("/get-user", requiredFields(arrayofRequiredFields.getUser), getUser);

router.route("/")
    .get(getTransactions)
    .post(requiredFieldsMiddlewareV2(p2pTransactionSchema), userBaseRateLimitter, makeTransaction);

export default router;
