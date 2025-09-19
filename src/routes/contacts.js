import express from "express";
import { syncContact } from "../controllers/payees/index.js";

const router = express.Router();

router.post("/sync", syncContact);

export default router;
