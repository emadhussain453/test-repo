/* eslint-disable no-restricted-syntax */
import cron from "node-cron";
import moment from "moment";
import logger from "../logger/index.js";
import Users from "../models/users.js";
import CronJobs from "../models/cronjobs.js";
import { AppEnviornments, CronJobs as AvailableJobs, Status } from "../constants/index.js";
import sendEmail from "../config/sendgrid.js";
import CardOrderAlertMinBalanceSpanish from "../templates/cardOrderAlertMinBalanceSpanish.js";
import CardOrderAlertMinBalance from "../templates/cardOrderAlterMinBalance.js";
import CardOrderNowMinBalance from "../templates/cardOrderNowMinBalance.js";
import CardOrderNowMinBalanceSpanish from "../templates/cardOrderNowMinBalanceSpanish.js";
import CronJobStatuses from "../models/cronjobstatuses.js";

async function cronJob() {
    let jobId;
    let jobName;
    let jobStatusId;
    try {
        // check if cron is allowd
        const jobConfig = await CronJobs.findOne({ name: AvailableJobs.MinBalanceAlertsForCard });
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
        const query = {
            isVerified: true,
            isDeleted: false,
            $or: [
                {
                    $and: [
                        {
                            minimumBalance: {
                                $gte: 25,
                            },
                        },
                        {
                            $or: [
                                {
                                    "card.virtual": false,
                                },
                                {
                                    "card.physical": false,
                                },
                            ],
                        },
                    ],
                },
                {
                    minimumBalance: {
                        $lt: 25,
                    },
                },
            ],
        };

        let counter = 0;
        let totalEmails = 0;
        let totalBatches = 0;
        const batchSize = 200;
        let hasMinimumBalance = { es: [], en: [] };
        let minimumBalanceRequired = { es: [], en: [] };
        logger.info("Balance Alerts emails started running ... ");
        for await (const user of Users.find(query).select("email card minimumBalance language").batchSize(batchSize).cursor()) {
            const { email, minimumBalance, language = "es", card: { virtual, physical } } = user;
            totalEmails += 1;
            counter += 1;
            if (minimumBalance < 25) {
                minimumBalanceRequired[language].push(email);
            }
            if (minimumBalance >= 25 && (!virtual || !physical)) {
                hasMinimumBalance[language].push(email);
            }

            if (counter === batchSize) {
                const promise = [];
                totalBatches += 1;
                if (minimumBalanceRequired.en.length > 0) promise.push(sendEmail(minimumBalanceRequired.en, "You're Almost There! 🏁", CardOrderAlertMinBalance()));
                if (minimumBalanceRequired.es.length > 0) promise.push(sendEmail(minimumBalanceRequired.es, "¡Ya casi alcanzas tu meta! 🏁", CardOrderAlertMinBalanceSpanish()));
                if (hasMinimumBalance.en.length > 0) promise.push(sendEmail(hasMinimumBalance.en, "Request Your Stable® Card Today! 🌟", CardOrderNowMinBalance()));
                if (hasMinimumBalance.es.length > 0) promise.push(sendEmail(hasMinimumBalance.es, "¡Solicita tu tarjeta Stable® hoy! 🌟", CardOrderNowMinBalanceSpanish()));
                counter = 0;
                hasMinimumBalance = { es: [], en: [] };
                minimumBalanceRequired = { es: [], en: [] };
                await Promise.all(promise);
                logger.info(`Batch ${totalBatches} is completed`);
            }
        }
        // process the leftouts
        if (counter !== batchSize) {
            const promise = [];
            if (minimumBalanceRequired.en.length > 0) promise.push(sendEmail(minimumBalanceRequired.en, "You're Almost There! 🏁", CardOrderAlertMinBalance()));
            if (minimumBalanceRequired.es.length > 0) promise.push(sendEmail(minimumBalanceRequired.es, "¡Ya casi alcanzas tu meta! 🏁", CardOrderAlertMinBalanceSpanish()));
            if (hasMinimumBalance.en.length > 0) promise.push(sendEmail(hasMinimumBalance.en, "Request Your Stable® Card Today! 🌟", CardOrderNowMinBalance()));
            if (hasMinimumBalance.es.length > 0) promise.push(sendEmail(hasMinimumBalance.es, "¡Solicita tu tarjeta Stable® hoy! 🌟", CardOrderNowMinBalanceSpanish()));
            await Promise.all(promise);

            logger.info(`Processed total ${counter} leftouts`);
        }

        logger.info(`Total ${totalEmails} emails sent.`);

        await CronJobStatuses.findOneAndUpdate(
            jobStatusId,
            {
                $push: {
                    statusHistory: {
                        status: Status.COMPLETED,
                        message: `${totalEmails} emails has been Processed`,
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
        return logger.error(`Cron Job :: ${error.message}`);
    }
}

const jonSchedule = "0 0 * * 0";
const sendMinimumBalanceAlerts = cron.schedule(jonSchedule, cronJob); // every 7 days 0 0 * * 0

export default sendMinimumBalanceAlerts;
