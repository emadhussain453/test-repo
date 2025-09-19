import express from "express";
import { CreateInstrument, DisableInstrument, FinixPayment, GetInstruments } from "../controllers/finix/index.js";
import requiredFieldsMiddlewareV2 from "../middlewares/requiredFieldsMiddlewareV2.js";
import { CreateInstrumentSchema, FinixPaymentSchema } from "../constants/joiSchemas.js";

const router = express.Router();

router.post("/", requiredFieldsMiddlewareV2(FinixPaymentSchema), FinixPayment);
router.post("/instrument", requiredFieldsMiddlewareV2(CreateInstrumentSchema), CreateInstrument);
router.get("/", GetInstruments);
router.put("/", DisableInstrument);

export default router;
