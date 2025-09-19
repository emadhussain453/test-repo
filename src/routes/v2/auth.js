import express from "express";
import { changeCurrentPasswordV2 } from "../../controllers/auth/index.js";
import userBaseRateLimitter from "../../middlewares/userBaseRateLimitter.js";
import requiredFieldsMiddlewareV2 from "../../middlewares/requiredFieldsMiddlewareV2.js";
import { ChangePasswordSchema } from "../../constants/joiSchemas.js";
import Users from "../../models/users.js";
import authMiddleware from "../../middlewares/authMiddleware.js";

const router = express.Router();
router.put("/password", authMiddleware(Users), userBaseRateLimitter, requiredFieldsMiddlewareV2(ChangePasswordSchema), changeCurrentPasswordV2);

export default router;
