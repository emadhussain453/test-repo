/* eslint-disable import/no-cycle */
// eslint-disable-next-line node/no-unsupported-features/node-builtins
import { Worker } from "worker_threads";
import EventEmitter from "events";
import { EventTypes, FlagsWithColor, NotificationPriority, ScoreKeys, Status } from "../constants/index.js";
import logger from "../logger/index.js";
import Notifications from "../models/notifications.js";
import SystemLogs from "../models/systemLogs.js";
import redisClient from "../config/redis.js";
import Users from "../models/users.js";
import OpenAILogs from "../models/openAILogs.js";
import { translateWithLenguageSpecifiedV1 } from "../middlewares/transalations.js";
import chooseEmailTemplateAndMessage from "../utils/chooseTemplateAndMessage.js";
import sendEmailOrMessageV3 from "../utils/sendEmailOrMessageV3.js";
import notificationsQueue from "../queues/notificationQueue.js";
import SetOtpValues from "../utils/setOtpValues.js";
import checkDeviceAndUpdateDeviceStatus from "../utils/checkDeviceStatus.js";
import blockAllCards from "../utils/blockCards.js";
import PomeloUsers from "../models/pomeloUser.js";
import activeNotificationTokenOfUser from "../utils/Notifications/activeNotificationTokenOfUser.js";
import capitalizeName from "../utils/capitalizeName.js";
import updateUserScore from "../utils/updateUserScore.js";
import fraudDetectionBlock from "../utils/fraudDetection/fraudDetectionUserBlock.js";
import getAppConfig from "../utils/getAppConfig.js";

const Event = new EventEmitter();

Event.on(EventTypes.Notification, async (notifcationData) => {
    try {
        const { userId, title, message, spanishMessage, type, userIpAddress } = notifcationData;
        if (!userId) {
            throw new Error("User Id is required.");
        }
        if (!message) {
            throw new Error("Message is required.");
        }

        const notifcation = new Notifications({
            userId,
            message,
            title,
            type,
            spanishMessage,
            userIpAddress,
        });

        await Promise.all([
            notifcation.save(),
            Users.findOneAndUpdate({ _id: userId }, { $inc: { notificationCount: 1 } }),
        ]);
    } catch (error) {
        logger.error(`Notifcation Event ${error.message}}`);
    }
});

Event.on(EventTypes.UpdateDevicesInformation, async (data) => {
    try {
        const { devices, userId, language, notificationToken, deviceId, deviceOS, deviceModel, userIpAddress } = data;
        if (!userId) {
            throw new Error("User Id is required.");
        }

        await Promise.all([
            checkDeviceAndUpdateDeviceStatus(devices, userId, language, notificationToken, deviceId, deviceOS, deviceModel, userIpAddress),
            SetOtpValues(userId),
        ]);
    } catch (error) {
        logger.error(`UpdateDeviceInformation Event ${error.message}}`);
    }
});

Event.on(EventTypes.checkForSameIpAndDevice, async (data) => {
    try {
        const { userId, ip, deviceId } = data;

        if (ip && deviceId && userId) {
            const users = await Users.find({ ip, "devices.deviceId": deviceId, _id: { $ne: userId } }).select("flag fraudDetection");
            if (users.length > 0) {
                // update user score
                const scoreData1 = {
                    userId,
                    code: ScoreKeys.MULTI_IP,
                };
                Event.emit(EventTypes.UpdateUserScore, scoreData1);
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
    } catch (error) {
        logger.error(`UpdateDeviceInformation Event ${error.message}}`);
    }
});
Event.on(EventTypes.NotificationError, (error) => {
    logger.error(`UpdateDeviceInformation Event error: ${error.message}`);
});

// system thrid party api call logs
Event.on(EventTypes.beckEndLogs, async (logs) => {
    try {
        await redisClient.lPush(EventTypes.beckEndLogs, JSON.stringify(logs));
        const logsLength = await redisClient.LLEN(EventTypes.beckEndLogs);
        if (logsLength >= 25) {
            const redislogs = await redisClient.lRange(EventTypes.beckEndLogs, 0, -1);
            const parsedLogs = redislogs.map((log) => JSON.parse(log));
            await SystemLogs.insertMany(parsedLogs);
            redisClient.del(EventTypes.beckEndLogs);
        }
    } catch (error) {
        logger.error(`systemLogs Event ${error.message}}`);
    }
});

function runWorker(bufferImage) {
    return new Promise((resolve, reject) => {
        const worker = new Worker("./src/Events/worker.js");
        worker.postMessage({ bufferImage });

        // Listen for the result from the worker
        worker.on("message", (result) => {
            if (result.success) {
                resolve(result.imageBlurhash);
            } else {
                reject(result.error);
            }
        });

        // Handle any error from the worker
        worker.on("error", (error) => {
            reject(error);
        });

        // Handle worker exit
        worker.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}
Event.on(EventTypes.GenerateBlurHash, async ({ bufferImage, userId }) => {
    try {
        const imageBlurhash = await runWorker(bufferImage);
        await Users.updateOne({ _id: userId }, { $set: { "avatar.blurHash": imageBlurhash } });
    } catch (error) {
        logger.error(`Error creating blurhash of image :: ${error}`);
    }
});

Event.on(EventTypes.OpenAILogs, async (logs) => {
    try {
        await redisClient.lPush(EventTypes.OpenAILogs, JSON.stringify(logs));
        const logsLength = await redisClient.LLEN(EventTypes.OpenAILogs);
        if (logsLength >= 25) {
            const redislogs = await redisClient.lRange(EventTypes.OpenAILogs, 0, -1);
            const parsedLogs = redislogs.map((log) => JSON.parse(log));
            await OpenAILogs.insertMany(parsedLogs);
            redisClient.del(EventTypes.OpenAILogs);
        }
    } catch (error) {
        logger.error(`OpenAILogs Event ${error.message}}`);
    }
});

Event.on(EventTypes.PomeloCardNotification, async (notificationData) => {
    try {
        const { isPomeloUser, additionalData, pushNotificationPayload: { title, message, tokens, additionalDetails }, transaction, status } = notificationData;
        await notificationsQueue.add("pushNotification", {
            title,
            message,
            tokens,
            additionalDetails,
        }, { priority: NotificationPriority.TWO });
        // send email
        if (status === Status.COMPLETED) {
            const cardCreditEmailSubject = await translateWithLenguageSpecifiedV1(isPomeloUser.userId.language)("card_email_subject", { type: transaction.type.toLowerCase() });
            const cardCreditEmailTemplate = await translateWithLenguageSpecifiedV1(isPomeloUser.userId.language)("card_email_template");
            await sendEmailOrMessageV3({ email: isPomeloUser.userId.email, onEmail: true, emailSubject: cardCreditEmailSubject, templates: chooseEmailTemplateAndMessage(cardCreditEmailTemplate, false, additionalData) });
        }
    } catch (error) {
        logger.error("Notification not send");
    }
});

Event.on(EventTypes.FailedCardTransactionCount, async (payload) => {
    const { userId, cardId, status, failedTransactionCardCount } = payload;

    try {
        if (status === Status.COMPLETED && failedTransactionCardCount < 7) {
            await PomeloUsers.findOneAndUpdate({ userId }, { failedTransactionCount: 0 });
            return;
        }
        if (status === Status.COMPLETED && failedTransactionCardCount >= 7) {
            await PomeloUsers.findOneAndUpdate({ userId }, { $inc: { failedTransactionCount: 0 } });
            return;
        }
        const user = await PomeloUsers.findOneAndUpdate(
            { userId },
            { $inc: { failedTransactionCount: 1 } },
            { new: true },
        ).populate({
            path: "userId",
            select: "firstName lastName email language devices",
        });
        const { failedTransactionCount } = user;
        const { language = "en", devices, firstName, lastName, email } = user.userId;

        const messageKeys = {
            3: "failed_payment_update_info",
            5: "failed_payment_warning",
            6: "failed_payment_last_attempt",
            7: "card_frozen_alert",
        };

        const titleTranslations = {
            en: {
                3: "Payment Failed",
                5: "Payment Failed",
                6: "Payment Failed",
                7: "Card Freeze",
            },
            es: {
                3: "Pago Fallido",
                5: "Pago Fallido",
                6: "Pago Fallido",
                7: "Tarjeta Congelada",
            },
        };

        const lang = ["en", "es"].includes(language) ? language : "en";

        if (failedTransactionCount >= 7) {
            await blockAllCards(userId);
        }
        let messageKey;
        if (failedTransactionCount >= 7) {
            messageKey = "card_frozen_alert";
        } else {
            messageKey = messageKeys[failedTransactionCount];
        }
        if (!messageKey) return;
        // push notification
        const tokens = activeNotificationTokenOfUser(devices);
        const notificationMessage = await translateWithLenguageSpecifiedV1(lang)(messageKey);

        Event.emit(EventTypes.PomeloCardNotification, {
            isPomeloUser: user,
            additionalData: {
                message: await translateWithLenguageSpecifiedV1(lang)("failed_attempt_count", {
                    failedTransactionCount,
                }),
            },
            pushNotificationPayload: {
                title: titleTranslations[lang]?.[failedTransactionCount >= 7 ? 7 : failedTransactionCount] || "Payment Failed",
                message: notificationMessage,
                tokens,
            },
            status: Status.FAILED,
        });

        // Email
        const emailMessage = await translateWithLenguageSpecifiedV1(lang)(messageKey);
        const emailTemplate = await translateWithLenguageSpecifiedV1(lang)("failed_card_template");

        const emailPayload = {
            fullName: `${capitalizeName(firstName)} ${capitalizeName(lastName)}`,
            message: emailMessage,
        };

        await sendEmailOrMessageV3({
            email,
            onEmail: true,
            emailSubject: await translateWithLenguageSpecifiedV1(lang)("card_failed_warning"),
            templates: chooseEmailTemplateAndMessage(emailTemplate, false, emailPayload),
        });
    } catch (error) {
        logger.error(`Error in updating failedTransactionCount for userId ${userId} cardId: ${cardId} .`);
    }
});

Event.on(EventTypes.UpdateUserScore, async ({ userId, code }) => {
    try {
        await updateUserScore(userId, code);
    } catch (error) {
        logger.error(`Error updating user score :: ${error}`);
    }
});
export default Event;
