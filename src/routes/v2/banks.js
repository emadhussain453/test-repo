import express from "express";
import { getBanksV3 } from "../../controllers/banks/index.js";

const router = express.Router();

router.get("/", getBanksV3);

export default router;
