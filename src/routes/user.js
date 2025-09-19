import multer from "multer";
import express from "express";
import { createUserName, deleteUserAccountTemporarily, updateDetails, updateLanguage, updatePasscode, userBalanceHistory, uploadAvatar, verifyPasscode, deleteDevice, removeOtuField, userTutorialStatus, saveIdNumber, changeMainDevice, servicesAvailableDetails, allowNotification, requestpOtp, CreateAiPriseProfile, UploadDocument, GetDocuments, cashinValume, userHaveToUploadBankStatement, checkForSoftBlock, freshBalance } from "../controllers/user/index.js";
import { PassCodeSchema, UpdateLanguageSchema, UserNameSchema, updateUserDetailsSchema, VerifyPassCodeSchema, deleteDeviceSchema, tutorialSchema, saveIdNumberSchema, allowNotificationSchema, changeMainDeviceSchema } from "../constants/joiSchemas.js";
import Users from "../models/users.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requiredFieldsMiddlewareV2 from "../middlewares/requiredFieldsMiddlewareV2.js";
import uploadAvatarMiddleware from "../middlewares/uploadAvatarMiddleware.js";
import userBaseRateLimitter from "../middlewares/userBaseRateLimitter.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/aiprise-profile", authMiddleware(Users), CreateAiPriseProfile);
router.post("/upload", upload.single("file"), authMiddleware(Users), UploadDocument);
router.post("/username", requiredFieldsMiddlewareV2(UserNameSchema), authMiddleware(Users), createUserName);
router.put("/passcode", requiredFieldsMiddlewareV2(PassCodeSchema), authMiddleware(Users), updatePasscode);
router.post("/passcode/verify", requiredFieldsMiddlewareV2(VerifyPassCodeSchema), authMiddleware(Users), userBaseRateLimitter, verifyPasscode);
router.put("/language", requiredFieldsMiddlewareV2(UpdateLanguageSchema), authMiddleware(Users), updateLanguage);
router.patch("/", requiredFieldsMiddlewareV2(updateUserDetailsSchema), authMiddleware(Users), updateDetails);
router.put("/avatar", authMiddleware(Users), uploadAvatarMiddleware, uploadAvatar);
router.delete("/", authMiddleware(Users), deleteUserAccountTemporarily);
router.get("/", authMiddleware(Users), userBalanceHistory);
router.get("/documents", authMiddleware(Users), GetDocuments);
router.get("/services", authMiddleware(Users), servicesAvailableDetails);
router.delete("/device", requiredFieldsMiddlewareV2(deleteDeviceSchema), authMiddleware(Users), deleteDevice);
router.put("/device", requiredFieldsMiddlewareV2(changeMainDeviceSchema), authMiddleware(Users), changeMainDevice);
router.put("/device/notification", requiredFieldsMiddlewareV2(allowNotificationSchema), authMiddleware(Users), allowNotification);
router.patch("/modify-field", authMiddleware(Users), removeOtuField);
router.patch("/tutorial", authMiddleware(Users), requiredFieldsMiddlewareV2(tutorialSchema), userTutorialStatus);
router.post("/idnumber", requiredFieldsMiddlewareV2(saveIdNumberSchema), authMiddleware(Users), saveIdNumber);
router.get("/request-otp", authMiddleware(Users), requestpOtp);
router.get("/cashin-volume", authMiddleware(Users), cashinValume);
router.get("/check-for-bank-statement", authMiddleware(Users), userHaveToUploadBankStatement);
router.get("/check-for-soft-block", authMiddleware(Users), checkForSoftBlock);
router.get("/balance", authMiddleware(Users), freshBalance);

export default router;
