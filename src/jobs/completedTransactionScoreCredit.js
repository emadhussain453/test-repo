/* eslint-disable no-use-before-define */
/* eslint-disable no-restricted-syntax */
import moment from "moment";
import cron from "node-cron";
import CronJobs from "../models/cronjobs.js";
import { EventTypes, ScoreKeys, StableModelsNames, Status, CronJobs as AvailableJobs } from "../constants/index.js";
import Event from "../Events/databaseLogs.js";
import Transactions from "../models/transactions.js";
import Users from "../models/users.js";
import logger from "../logger/index.js";
import CronJobStatuses from "../models/cronjobstatuses.js";

function getTimeAfterMinueHours(hours) {
    const now = new Date();
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

async function hasContinuousCompletedTransactions(userId, requiredCount, time) {
    const transactions = await Transactions.find(
        {
            $and: [
                {
                    $or: [
                        { userId },
                        { from: userId },
                    ],
                },
                {
                    createdAt: { $gte: time },
                },
            ],
        },
        {
            createdAt: 1,
            status: 1,
            transactionType: 1,
            transactionModel: 1,
        },
    ).sort({ createdAt: 1 });

    let count = 0;

    for (const tx of transactions) {
        const isCompleted = tx.status === "COMPLETED" && (tx.transactionModel === StableModelsNames.CARD || tx.transactionModel === StableModelsNames.CASHIN_V1);
        const isBreakingStatus = tx.status !== Status.COMPLETED && tx.status !== Status.PENDING;
        if (isCompleted) {
            count += 1;
            if (count >= requiredCount) {
                return true;
            }
        } else if (isBreakingStatus) {
            count = 0;
        }
    }

    return false;
}

const batchSize = 200;
async function runWeeklyTransactionCheck() {
    let batch = [];
    let counter = 0;
    let totalProcessed = 0;
    let jobId;
    let jobName;
    let jobStatusId;
    try {
        logger.info("Starting Weekly Transaction Check...");
        // check if cron is allowd
        const jobConfig = await CronJobs.findOne({ name: AvailableJobs.GiveScoreOnCompletedTransactions });
        if (!jobConfig) {
            return logger.info(`Job Config not available`);
        }
        jobId = jobConfig._id;
        jobName = jobConfig.name;
        const { status, name } = jobConfig;
        if (!status) {
            return logger.info(`Job ${name} execution is blocked by admin`);
        }
        const jobPending = await CronJobStatuses.create({
            jobId,
            jobName,
            statusHistory: [{
                status: Status.PENDING,
                message: `Cron job has started.`,
                createdAt: moment().utc(),
            }],
        });
        jobStatusId = jobPending._id;

        const cashinTransactions = 3;
        const time = getTimeAfterMinueHours(168); // past 7 days
        // const timeToCheckFoUser = getTimeAfterMinueHours(960); // past 40 days
        const query = { isDeleted: false, isVerified: true };
        for await (const user of Users.find(query, { _id: 1, email: 1 }).batchSize(batchSize).cursor()) {
            counter += 1;
            totalProcessed += 1;
            batch.push(user);

            if (counter === batchSize) {
                await processUserBatch(batch, cashinTransactions, time);
                logger.info(`Processed batch of ${batch.length} users.`);
                batch = [];
                counter = 0;
            }
        }

        // Process remaining users
        if (batch.length > 0) {
            await processUserBatch(batch, cashinTransactions, time);
            logger.info(`Processed final batch of ${batch.length} users.`);
        }

        logger.info(`✅ Weekly Transaction Check complete. Total users checked: ${totalProcessed}`);
        await CronJobStatuses.findOneAndUpdate(
            jobStatusId,
            {
                $push: {
                    statusHistory: {
                        status: Status.COMPLETED,
                        message: `${totalProcessed} users has been Processed`,
                    },
                },
            },
        );
        return true;
    } catch (error) {
        if (jobStatusId) {
            await CronJobStatuses.findOneAndUpdate(
                jobStatusId,
                {
                    $push: {
                        statusHistory: {
                            status: Status.FAILED,
                            message: `Error :: ${error.message}`,
                        },
                    },
                },
            );
        }
        logger.error("❌ Error during Weekly Transaction Check:", error.message);
    }
    return true;
}

async function processUserBatch(batch, requiredCount, time) {
    const promises = batch.map((user) => hasContinuousCompletedTransactions(user._id, requiredCount, time)
        .then((result) => {
            if (result) {
                logger.info(`✅ User ${user.email} passed.`);
                Event.emit(EventTypes.UpdateUserScore, {
                    userId: user._id,
                    code: ScoreKeys.CASHIN_TRANSACTIONS,
                });
            } else {
                // logger.info(`❌ User ${user.email} did NOT pass.`);
            }
        })
        .catch((err) => {
            logger.error(`Error processing user ${user.email}:`, err.message);
        }));

    await Promise.allSettled(promises);
}

cron.schedule("0 0 * * 0", async () => {
    await runWeeklyTransactionCheck(); // runs every Sunday at XX:00 AM
});

export default runWeeklyTransactionCheck;
