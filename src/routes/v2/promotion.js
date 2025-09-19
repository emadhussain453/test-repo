import express from "express";
import getPromotionV2 from "../../controllers/promotions/getPomotionV2.js";

const router = express.Router();
router.get("/", getPromotionV2);

export default router;
