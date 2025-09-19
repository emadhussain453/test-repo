import express from "express";
import { getCategoriesV2 } from "../../controllers/tapi/index.js";

const router = express.Router();
router.get("/categories", getCategoriesV2);

export default router;
