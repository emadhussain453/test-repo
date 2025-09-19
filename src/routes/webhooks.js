import express from "express";
import { transactionsDebit, transactionsCredit, notifications, authorizations, shippingUpdates, activateCard, cardEvents } from "../webhooks/pomelo/index.js";

const router = express.Router();

router.post("/transactions/adjustments/debit", transactionsDebit);
router.post("/transactions/v1/notifications", notifications);
router.post("/transactions/authorizations", authorizations);
router.post("/transactions/adjustments/credit", transactionsCredit);
router.post("/shipping/updates", shippingUpdates);
router.post("/card/events", cardEvents);
router.get("/card/active/success", activateCard);

export default router;
