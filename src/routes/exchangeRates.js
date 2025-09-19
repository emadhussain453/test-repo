import express from "express";
import { getCurrencyExchangeRateV1 } from "../controllers/exchangeRate/index.js";

const router = express.Router();

router.get("/", getCurrencyExchangeRateV1);

export default router;
