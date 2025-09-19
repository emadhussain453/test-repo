import express from "express";
import { addBenefeciery, deleteBeneficiary, favoriteBeneficiary, getBeneficiaries } from "../controllers/onepayKushkiBeneficiery/index.js";

const router = express.Router();

router.post("/", addBenefeciery);
router.get("/", getBeneficiaries);
router.put("/", favoriteBeneficiary);
router.delete("/", deleteBeneficiary);

export default router;
