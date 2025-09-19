import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import Users from "../../models/users.js";
import verificationMiddleware from "../../middlewares/verificationMiddleware.js";
import Payment from "./payment.js";
import UserAPIs from "./user.js";
import AuthAPIs from "./auth.js";
import QuickPay from "./quickpay.js";
import Promotion from "./promotion.js";
import ExchangeRate from "./exchangeRates.js";
import hmacMiddleware from "../../middlewares/hmacDecryption.js";
import BanksAPIs from "./banks.js";

const router = express.Router();

router.use("/payment", authMiddleware(Users), verificationMiddleware, Payment);
router.use("/user", authMiddleware(Users), UserAPIs);
router.use("/auth", AuthAPIs);
router.use("/exchange", hmacMiddleware(), authMiddleware(Users), verificationMiddleware, ExchangeRate);
router.use("/banks", hmacMiddleware(), authMiddleware(Users), BanksAPIs);
router.use("/quick-payment", QuickPay);
router.use("/promotions", Promotion);

export default router;
