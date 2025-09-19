import express from "express";
import requiredFields from "../../middlewares/requiredFieldsMiddleware.js";
import { cashinDynamicV2, cashoutV2 } from "../../controllers/directa24/index.js";
import { arrayofRequiredFields } from "../../constants/index.js";
import userBaseRateLimitter from "../../middlewares/userBaseRateLimitter.js";

const router = express.Router();
router.post("/cashout", userBaseRateLimitter, requiredFields(arrayofRequiredFields.cashOut, false), cashoutV2);
router.post("/cashin/dynamic", userBaseRateLimitter, cashinDynamicV2);

export default router;
