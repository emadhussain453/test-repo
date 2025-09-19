import express from "express";
import { cardStatus, createUserForCard, getShipment, orderCard, updateCardShipment, userSecureToken, activateCard, viewCardDetail, blockCard, unblockCard, disableCard, reOrderCard, updateCardPin, userDetails } from "../controllers/card/index.js";
import requiredFieldsMiddlewareV2 from "../middlewares/requiredFieldsMiddlewareV2.js";
import { CreateUserOnPomeloAddressSchema } from "../constants/joiSchemas.js";
import userBaseRateLimitter from "../middlewares/userBaseRateLimitter.js";

const router = express.Router();

router.post("/", userBaseRateLimitter, orderCard);
router.post("/reorder", userBaseRateLimitter, reOrderCard);
router.get("/", cardStatus);
router.get("/details", userDetails);
router.post("/user", requiredFieldsMiddlewareV2(CreateUserOnPomeloAddressSchema), createUserForCard);
router.get("/user/secure-token", userSecureToken);

router.get("/shipment", getShipment);
router.put("/shipment", updateCardShipment);

router.get("/actions/activate", activateCard);
router.get("/actions/view-details", viewCardDetail);
router.patch("/actions/block", blockCard);
router.patch("/actions/unblock", unblockCard);
router.patch("/actions/disable", disableCard);
router.patch("/actions/update-pin", updateCardPin);

export default router;
