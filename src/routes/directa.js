import express from "express";
import requiredFields from "../middlewares/requiredFieldsMiddleware.js";
import { cashinThroughPSE, cashinThroughCard, cashout, cashoutStatus, cancelCashout, validationCashinThroughCard, validationCashinThroughPSE, cashinDynamic, bankValidation, getBanks } from "../controllers/directa24/index.js";
import { FeatureNames, arrayofRequiredFields } from "../constants/index.js";
import checkFeatureStatus from "../middlewares/checkFeatureStatus.js";
import createPayment from "../controllers/onepay/createPayment.js";
import blockedApis from "../middlewares/blockApisMiddleware.js";
import blockedPayvalida from "../middlewares/payvalidaBlock.js";
import userBaseRateLimitter from "../middlewares/userBaseRateLimitter.js";

const router = express.Router();

router.post("/cashin/card", blockedPayvalida, requiredFields(arrayofRequiredFields.cashInCard), validationCashinThroughCard, cashinThroughCard);
router.post("/cashin/pse", blockedPayvalida, requiredFields(arrayofRequiredFields.cashInPSE), validationCashinThroughPSE, cashinThroughPSE);
router.post("/cashout", userBaseRateLimitter, requiredFields(arrayofRequiredFields.cashOut, false), cashout);
router.post("/cashout/status", requiredFields(arrayofRequiredFields.cancelAndStatusCashout), cashoutStatus);
router.delete("/cashout/cancel", requiredFields(arrayofRequiredFields.cancelAndStatusCashout), cancelCashout);
router.post("/cashin/dynamic", userBaseRateLimitter, requiredFields(arrayofRequiredFields.cashInDyn, false), validationCashinThroughPSE, cashinDynamic);
router.post("/onepay", requiredFields(arrayofRequiredFields.onepayCreatepayment, false), createPayment);
router.get("/banks", getBanks);

export default router;
