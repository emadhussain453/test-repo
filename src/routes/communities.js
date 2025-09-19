import express from "express";
import { getAllCommunities, getUserCommunities, joinCommunity, unJoinCommunity } from "../controllers/communities/index.js";
import userBaseRateLimitter from "../middlewares/userBaseRateLimitter.js";

const router = express.Router();

router.get("/", getAllCommunities);
router.get("/user", getUserCommunities);
router.post("/join", userBaseRateLimitter, joinCommunity);
router.put("/unjoin", userBaseRateLimitter, unJoinCommunity);

export default router;
