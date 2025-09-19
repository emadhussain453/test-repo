import express from "express";
import { GetAppConfigurations, GetAppVersion, updateAppVersion } from "../controllers/app/index.js";
import appVersionMiddleware from "../middlewares/appVersionMiddleware.js";
import requiredFieldsMiddlewareV2 from "../middlewares/requiredFieldsMiddlewareV2.js";
import { updateAppVersionSchema } from "../constants/joiSchemas.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Users from "../models/users.js";

const router = express.Router();

router.get("/", GetAppVersion);
router.get("/config", authMiddleware(Users), GetAppConfigurations);
router.put("/", appVersionMiddleware, requiredFieldsMiddlewareV2(updateAppVersionSchema), updateAppVersion);

export default router;
