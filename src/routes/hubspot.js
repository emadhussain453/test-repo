import express from "express";
import { startAChat } from "../controllers/hupspot/index.js";

const router = express.Router();

router.route("/chat")
    .get(startAChat);

export default router;
