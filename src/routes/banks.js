import express from "express";
import { getBanksV2, searchBanks } from "../controllers/banks/index.js";

const router = express.Router();

router.get("/", getBanksV2);
router.get("/search", searchBanks);

export default router;
