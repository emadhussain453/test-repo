import express from "express";
import { getCities, getStates } from "../controllers/states/index.js";

const router = express.Router();

router.get("/", getStates);
router.get("/city", getCities);

export default router;
