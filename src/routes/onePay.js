import express from "express";
import { CreateOnepayAccount, CreateOnepayClient, createPayment, listPayment, onepayCashout, listOfBanks, customerAccounts, customerAccountDelete, onePayCashin } from "../controllers/onepay/index.js";
import requiredFieldsMiddlewareV2 from "../middlewares/requiredFieldsMiddlewareV2.js";
import { createOnepayAccountSchema, onepayCashinSchema, onePayCashoutSchema } from "../constants/joiSchemas.js";
import userBaseRateLimitter from "../middlewares/userBaseRateLimitter.js";

const router = express.Router();

router.get("/", listPayment);
router.get("/banks", listOfBanks);
router.get("/accounts", customerAccounts);
router.post("/", createPayment);
router.post("/cashout", requiredFieldsMiddlewareV2(onePayCashoutSchema), onepayCashout);
router.post("/cashin", userBaseRateLimitter, requiredFieldsMiddlewareV2(onepayCashinSchema), onePayCashin);
router.post("/customers", CreateOnepayClient);
router.post("/accounts", requiredFieldsMiddlewareV2(createOnepayAccountSchema), CreateOnepayAccount);
router.delete("/accounts", customerAccountDelete);

export default router;
