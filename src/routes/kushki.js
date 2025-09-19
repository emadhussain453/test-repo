import express from "express";
import { createPaymentLink, kushkiCashin, kushkiCashinEffecty, kushkiCashoutEffecty, listOfBanks } from "../controllers/kushki/index.js";
import userBaseRateLimitter from "../middlewares/userBaseRateLimitter.js";

const router = express.Router();

router.get("/banks", listOfBanks);
router.post("/cashin", kushkiCashin);
router.post("/cashin/cash", userBaseRateLimitter, kushkiCashinEffecty);
router.post("/cashout/cash", kushkiCashoutEffecty);
router.post("/payment-link", createPaymentLink);

export default router;
