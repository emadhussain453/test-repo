import express from "express";
import { registerToApplePay } from "../controllers/applepay/index.js";
import requiredFields from "../middlewares/requiredFieldsMiddleware.js";
import { arrayofRequiredFields } from "../constants/index.js";

const router = express.Router();

router.post("/register", requiredFields(arrayofRequiredFields.registerUserCardToApplePay), registerToApplePay);

export default router;
