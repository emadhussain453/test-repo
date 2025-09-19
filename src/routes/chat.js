import express from "express";
import { chatWithAi } from "../controllers/ai/index.js";
import ipBaseRateLimitter from "../middlewares/ipBaseRateLimitter.js";

const router = express.Router();

router.post("/ai", ipBaseRateLimitter, chatWithAi);

export default router;
