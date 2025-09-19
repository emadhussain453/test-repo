import express from "express";
import { GetJumioToken, GetDirectaExchangeRates, DisableCardByAdmin, blockCardFromPomelo, unBlockCardFromPomelo, activatePomeloCard, runCronJob, cardDispute } from "../controllers/admin/index.js";
import adminAPIsAuthMiddleware from "../middlewares/adminAPIsAuthMiddleware.js";

const router = express.Router();

// jumio
router.get("/jumio/token", GetJumioToken);
router.get("/d24/exchange", GetDirectaExchangeRates);
router.patch("/card/disable", adminAPIsAuthMiddleware, DisableCardByAdmin);
router.patch("/card/activate", activatePomeloCard);
router.patch("/card/block", blockCardFromPomelo);
router.patch("/card/unblock", unBlockCardFromPomelo);
router.post("/card/dispute", cardDispute);
router.post("/cron-job", runCronJob);

export default router;
