import express from "express";
import { getOnepayKushkiBanks, onePayKushkiCashin, onePayKushkiCashout } from "../controllers/onepayKushki/index.js";
import userBaseRateLimitter from "../middlewares/userBaseRateLimitter.js";
import BeneficiaryAPIs from "./onepayKushkiBeneficiary.js";

const router = express.Router();

router.get("/banks", getOnepayKushkiBanks);
router.post("/cashin", userBaseRateLimitter, onePayKushkiCashin);
router.post("/cashout", onePayKushkiCashout);

router.use("/beneficiary", BeneficiaryAPIs);

export default router;
