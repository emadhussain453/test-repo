import express from "express";
import { AddCashoutBeneficiary, DeleteCashoutBeneficiary, GetCashoutBeneficiary, UpdateCashoutBeneficiary } from "../controllers/cashoutBeneficiary/index.js";
import requiredFieldsMiddlewareV2 from "../middlewares/requiredFieldsMiddlewareV2.js";
import { addCashoutBeneficiarySchema, updateCashoutBeneficiarySchema } from "../constants/joiSchemas.js";

const router = express.Router();

router.get("/", GetCashoutBeneficiary);
router.delete("/", DeleteCashoutBeneficiary);
router.put("/", requiredFieldsMiddlewareV2(updateCashoutBeneficiarySchema), UpdateCashoutBeneficiary);
router.post("/", requiredFieldsMiddlewareV2(addCashoutBeneficiarySchema), AddCashoutBeneficiary);

export default router;
