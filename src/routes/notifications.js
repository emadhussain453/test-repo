import express from "express";
import { deleteNotifications, getNotifications, readAllNotifications, updateNotificationsStatus } from "../controllers/notifications/index.js";
import blockedApis from "../middlewares/blockApisMiddleware.js";

const router = express.Router();

router.put("/all", readAllNotifications);
router.route("/")
    .get(getNotifications)
    .put(blockedApis, updateNotificationsStatus)
    .delete(blockedApis, deleteNotifications);

export default router;
