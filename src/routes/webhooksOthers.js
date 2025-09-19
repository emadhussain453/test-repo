import express from "express";
import { onePayCashoutWebHook, onePayWebHook, onePayWebHookCashin, onePayWebHookCashout } from "../webhooks/onepay/index.js";
import { hubspotMessages } from "../webhooks/hubspot/index.js";
import { documentWebhook, kycStatus } from "../webhooks/aiprise/index.js";
import sessionValidation from "../webhooks/sessionValidation/sessionValidation.js";
import { kushkiCashinWebHook, kushkiCashoutWebHook, kushkiPaymentLinkWebHook, kushkiWebHookPaymentLink } from "../webhooks/kushki/index.js";

const router = express.Router();

router.post("/onepay", onePayWebHook);
router.post("/onepay/queue", onePayWebHookCashin);
router.post("/onepay/cashout/queue", onePayWebHookCashout);
router.post("/onepay/cashout", onePayCashoutWebHook);
router.post("/hubspot/messages", hubspotMessages);
router.post("/kyc/status", kycStatus);
router.post("/document", documentWebhook);
router.post("/bre-b/validate", sessionValidation);
router.post("/kushki/cashin", kushkiCashinWebHook);
router.post("/kushki/cashout", kushkiCashoutWebHook);
router.post("/kushki/smart-link", kushkiWebHookPaymentLink);

export default router;
