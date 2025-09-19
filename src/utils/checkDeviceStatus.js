import moment from "moment";
// eslint-disable-next-line import/no-cycle
import Event from "../Events/databaseLogs.js";
import Users from "../models/users.js";
import { translateWithLenguageSpecifiedV1 } from "../middlewares/transalations.js";
import notificationsQueue from "../queues/notificationQueue.js";
import { EventTypes, FlagsWithColor, NotificationPriority, ScoreKeys } from "../constants/index.js";
import logger from "../logger/index.js";
import fraudDetectionBlock from "./fraudDetection/fraudDetectionUserBlock.js";
import getAppConfig from "./getAppConfig.js";

async function checkDeviceAndUpdateDeviceStatus(devices, userId, language, notificationToken, deviceId, deviceOS, deviceModel, ip) {
    try {
        let isNewDevice = false;
        // if this device notifId doesnt exisits in user device array then register this device as well
        await Users.updateMany({ _id: userId }, { $set: { "devices.$[].loginStatus": false, "devices.$[].notificationStatus": false } });
        const lastLoginAt = moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
        const query = {
            newDevice: false,
            oldDeviceWithId: false,
            oldDeviceWithToken: false,
            oldSameDevice: false,
            isMianDevice: false,
        };

        for (let i = 0; i < devices.length; i++) {
            const device = devices[i];
            if (device.deviceId === deviceId && device.notificationToken === notificationToken) {
                query.oldSameDevice = true;
                query.newDevice = false;
                if (device.isMainDevice) query.isMianDevice = true;
                break;
            }
            if (device.deviceId === deviceId && device.notificationToken !== notificationToken) {
                query.oldDeviceWithId = true;
                query.newDevice = false;
                if (device.isMainDevice) query.isMianDevice = true;
                break;
            }
            if (device.deviceId !== deviceId && device.notificationToken === notificationToken) {
                query.oldDeviceWithToken = true;
                query.newDevice = false;
                if (device.isMainDevice) query.isMianDevice = true;
                break;
            }
            if (device.deviceId !== deviceId || device.notificationToken !== notificationToken) {
                query.newDevice = true;
            }
        }
        if (query.oldSameDevice && !query.oldDeviceWithId && !query.oldDeviceWithToken) {
            await Users.updateOne(
                { _id: userId, "devices.deviceId": deviceId },
                { $set: { "devices.$.loginStatus": true, "devices.$.notificationStatus": true, "devices.$.deviceModel": deviceModel, "devices.$.deviceOS": deviceOS, "devices.$.lastLoginAt": lastLoginAt } },
            );
        } else if (!query.oldSameDevice && query.oldDeviceWithId && !query.oldDeviceWithToken) {
            await Users.updateOne(
                { _id: userId, "devices.deviceId": deviceId },
                { $set: { "devices.$.notificationToken": notificationToken, "devices.$.loginStatus": true, "devices.$.notificationStatus": true, "devices.$.deviceModel": deviceModel, "devices.$.deviceOS": deviceOS, "devices.$.lastLoginAt": lastLoginAt } },
            );
        } else if (!query.oldSameDevice && !query.oldDeviceWithId && query.oldDeviceWithToken) {
            isNewDevice = true;
            await Users.updateOne(
                { _id: userId, "devices.notificationToken": notificationToken },
                { $set: { "devices.$.deviceId": deviceId, "devices.$.loginStatus": true, "devices.$.notificationStatus": true, "devices.$.deviceModel": deviceModel, "devices.$.deviceOS": deviceOS, "devices.$.lastLoginAt": lastLoginAt } },
            );
        } else {
            isNewDevice = true;
            const device = { notificationToken, deviceOS, deviceModel, deviceId, loginStatus: true, lastLoginAt };
            if (devices.length < 1) {
                device.isMainDevice = true;
                query.isMianDevice = true;
            }
            await Users.updateOne(
                { _id: userId },
                { $push: { devices: device } },
            );
        }

        // sendPushNotification to mainDevice if its not mainDevice
        if (!query.isMianDevice) {
            const mainDevice = devices.find((userDevice) => userDevice.isMainDevice);
            if (mainDevice) {
                await Users.updateOne({ _id: userId, "devices.isMainDevice": true }, { $set: { "devices.$.notificationStatus": true } });
                await notificationsQueue.add("pushNotification", {
                    title: "Sign in",
                    message: await translateWithLenguageSpecifiedV1(language)("alert_main_device_from_signin_attempt_with_diff_phone", { deviceOS, deviceModel }),
                    tokens: [mainDevice.notificationToken],
                }, { priority: NotificationPriority.ONE });
            }
        }

        // sendPushNotification to new device
        await notificationsQueue.add("pushNotification", {
            title: "Signin",
            message: await translateWithLenguageSpecifiedV1(language)("signin_push_notification"),
            tokens: [notificationToken],
        }, { priority: NotificationPriority.ONE });

        if (isNewDevice) {
            const dbUser = await Users.findOne({ _id: userId }).select("devices flag fraudDetection").lean();
            if (dbUser.devices.length > 1) {
                // update user score
                const scoreData = {
                    userId,
                    code: ScoreKeys.MULTI_DEVICES,
                };
                Event.emit(EventTypes.UpdateUserScore, scoreData);
                const flagToUpdated = FlagsWithColor.YELLOW;
                await Promise.all([
                    Users.updateOne({ _id: userId }, { $inc: { flag: flagToUpdated } }),
                ]);
                // Fraud detection check
                try {
                    if (!dbUser.fraudDetection?.softBlock) {
                        const app = await getAppConfig();
                        if (!app) throw new Error("App config not found");
                        const { flag } = app;
                        if ((dbUser.flag + flagToUpdated) >= flag) {
                            await fraudDetectionBlock(userId, "Flag limit reach");
                        }
                    }
                } catch (err) {
                    logger.error(`Error in fraud check functionality: ${err.message}`);
                }
            }
            if (ip && deviceId) {
                const users = await Users.find({ ip, "devices.deviceId": deviceId, _id: { $ne: userId } }).select("flag fraudDetection");
                if (users.length > 0) {
                    // update user score
                    const scoreHistoryData = {
                        userId,
                        code: ScoreKeys.MULTI_IP,
                    };
                    Event.emit(EventTypes.UpdateUserScore, scoreHistoryData);
                    users.forEach((user) => {
                        // update user score
                        const scoreData = {
                            userId: user._id,
                            code: ScoreKeys.MULTI_IP,
                        };
                        Event.emit(EventTypes.UpdateUserScore, scoreData);
                    });
                    const userIds = users.map((user1) => user1._id);
                    const flagToUpdated = FlagsWithColor.ORANGE;
                    await Promise.all([
                        Users.updateOne({ _id: userId }, { $inc: { flag: flagToUpdated } }),
                        Users.updateMany({ _id: { $in: userIds } }, { $inc: { flag: flagToUpdated } }),
                    ]);
                    // Fraud detection check
                    try {
                        const app = await getAppConfig();
                        if (!app) throw new Error("App config not found");
                        const { flag: fraudThreshold } = app;

                        const shouldBlockUser = (userDoc, isFinalCheck = false) => {
                            if (!userDoc || userDoc.fraudDetection?.softBlock) return false;

                            const currentFlag = userDoc.flag || 0;
                            return isFinalCheck
                                ? currentFlag >= fraudThreshold
                                : (currentFlag + flagToUpdated) >= fraudThreshold;
                        };
                        const usersFraudBlockPromises = users
                            .filter((user) => shouldBlockUser(user))
                            .map((user) => fraudDetectionBlock(user._id, "Flag limit reached"));

                        await Promise.all(usersFraudBlockPromises);

                        const otherUser = await Users.findOne({ _id: userId });
                        if (shouldBlockUser(otherUser, true)) {
                            await fraudDetectionBlock(otherUser._id, "Flag limit reached");
                        }
                    } catch (err) {
                        logger.error(`Error in fraud check functionality: ${err.message}`);
                    }
                }
            }
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

export default checkDeviceAndUpdateDeviceStatus;
