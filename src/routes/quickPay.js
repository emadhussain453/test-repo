import express from "express";
import { getCategories, getCompaniesCategories } from "../controllers/tapi/index.js";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/companies", getCompaniesCategories);

export default router;
