import express from "express";
import Message from "../controllers/welcome/message.js"; // --> direct importing the controller function

const router = express.Router();

router.get("/message", Message);

export default router;
