import express from "express";
import { changeMainDeviceV2, deleteDeviceV2, uploadAvatarV2 } from "../../controllers/user/index.js";
import requiredFieldsMiddlewareV2 from "../../middlewares/requiredFieldsMiddlewareV2.js";
import { changeMainDeviceSchema, deleteDeviceSchema } from "../../constants/joiSchemas.js";
import VerifyOtpMiddleware from "../../middlewares/verifyOtpMiddleWare.js";

const router = express.Router();
router.put("/avatar", uploadAvatarV2);
router.delete("/device", requiredFieldsMiddlewareV2(deleteDeviceSchema), deleteDeviceV2);
router.put("/device", requiredFieldsMiddlewareV2(changeMainDeviceSchema), VerifyOtpMiddleware, changeMainDeviceV2);

export default router;
