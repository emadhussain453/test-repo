import express from "express";
import { getPayees, createPayee, getPayee, deletePayee, favoritePayee } from "../controllers/payees/index.js";
import requiredFieldsMiddlewareV2 from "../middlewares/requiredFieldsMiddlewareV2.js";
import { CreatePayeeSchema } from "../constants/joiSchemas.js";

const router = express.Router();

router.get("/", getPayees);
router.get("/:payeeId", getPayee);
router.delete("/:payeeId", deletePayee);
router.put("/:payeeId", favoritePayee);
router.post("/", requiredFieldsMiddlewareV2(CreatePayeeSchema), createPayee);

export default router;
