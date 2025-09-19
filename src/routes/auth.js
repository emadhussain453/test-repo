import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { SignIn, SignUp, userConfirmation, Current, privateResendOtp, publicResendOtp, VerifyOtp, ForgetPasswordEmail, ResetPassword, EmailVerify, NumberVerify, SignOut, changeCurrentPassword, verifyCurrentPassword, RefreshToken } from "../controllers/auth/index.js";
import Users from "../models/users.js";
import IsOtpVerified from "../middlewares/isOtpVerified.js";
import VerifyOtpMiddleware from "../middlewares/verifyOtpMiddleWare.js";
import requiredFielsMiddlewareV2 from "../middlewares/requiredFieldsMiddlewareV2.js";
import { ChangePasswordSchema, CheckCurrentPasswordSchema, CreateUserSchema, ForgetPasswordEmailSchema, PrivateResentOtpSchema, PublicResentOtpSchema, ResetPasswordSchema, SignInSchema, UploadWorkflowImagesSchema, VerifyEmailOrPhoneNumberSchema, VerifyOtpSchema } from "../constants/joiSchemas.js";
import signatureValidationMiddleware from "../middlewares/validateStableBusinessApis.js";
import userBaseRateLimitter from "../middlewares/userBaseRateLimitter.js";
import ipBaseRateLimitter from "../middlewares/ipBaseRateLimitter.js";

const router = express.Router();

router.post("/signup", ipBaseRateLimitter, requiredFielsMiddlewareV2(CreateUserSchema), SignUp);
router.post("/signin", ipBaseRateLimitter, requiredFielsMiddlewareV2(SignInSchema), SignIn);
router.post("/verify-otp", ipBaseRateLimitter, requiredFielsMiddlewareV2(VerifyOtpSchema), VerifyOtp);
router.post("/forget-password", requiredFielsMiddlewareV2(ForgetPasswordEmailSchema), ipBaseRateLimitter, ForgetPasswordEmail);
router.post("/reset-password", requiredFielsMiddlewareV2(ResetPasswordSchema), ipBaseRateLimitter, IsOtpVerified, ResetPassword);
router.post("/public/resend-otp", requiredFielsMiddlewareV2(PublicResentOtpSchema), publicResendOtp);
router.post("/verify-email", authMiddleware(Users), requiredFielsMiddlewareV2(VerifyEmailOrPhoneNumberSchema), VerifyOtpMiddleware, EmailVerify);
router.post("/verify-phonenumber", authMiddleware(Users), requiredFielsMiddlewareV2(VerifyEmailOrPhoneNumberSchema), VerifyOtpMiddleware, NumberVerify);
router.post("/private/resend-otp", authMiddleware(Users), requiredFielsMiddlewareV2(PrivateResentOtpSchema), privateResendOtp);
router.get("/current", authMiddleware(Users), Current);
router.put("/confirmation", authMiddleware(Users), userConfirmation);
router.put("/password", authMiddleware(Users), userBaseRateLimitter, requiredFielsMiddlewareV2(ChangePasswordSchema), changeCurrentPassword);
router.post("/password/verify", authMiddleware(Users), userBaseRateLimitter, requiredFielsMiddlewareV2(CheckCurrentPasswordSchema), verifyCurrentPassword);

// sign out
router.post("/signout", SignOut);
router.post("/refresh-token", RefreshToken);

export default router;
