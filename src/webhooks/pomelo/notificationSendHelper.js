import { EventTypes } from "../../constants/index.js";
import logger from "../../logger/index.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import Event from "../../Events/databaseLogs.js";
import capitalizeName from "../../utils/capitalizeName.js";

const getNotitificationTitleAndMessage = async (language, transStatus, totalAfterAddingFee) => {
    const messages = {
        FAILED: "pemelo_transaction_debit_failed",
        COMPLETED: "pemelo_transaction_debit",
    };
    const titles = {
        es: {
            FAILED: "La compra falló",
            COMPLETED: "Compra 🎉",
        },
        en: {
            FAILED: "Purchase Failed",
            COMPLETED: "Purchase 🎉",
        },
    };
    return {
        title: titles[language][transStatus],
        notificationMessage: await translateWithLenguageSpecifiedV1(language)(messages[transStatus], { totalAfterAddingFee: convertToRequiredDecimalPlaces(totalAfterAddingFee, 2) }),
    };
};
const sendNotification = async (transStatus, pomeloUser, transactionPayload, notificationAdditionalPayload) => {
    const { firstName, lastName, language, devices } = pomeloUser.userId;
    const { transaction, merchant, card, amount, exchageRates, totalAfterAddingFee, oneStableCoin, localAmount } = transactionPayload;

    const userActiveNotificationToken = activeNotificationTokenOfUser(devices);
    const { title, notificationMessage } = await getNotitificationTitleAndMessage(language, transStatus, totalAfterAddingFee);
    const pushNotificationPayload = {
        title,
        message: notificationMessage,
        tokens: userActiveNotificationToken,
        additionalDetails: notificationAdditionalPayload,
    };
    const fullName = `${capitalizeName(firstName)} ${capitalizeName(lastName)}`;
    const [date, time] = transaction.local_date_time.split("T");
    const additionalData = {
        fullName,
        purchase: merchant.name,
        date,
        time,
        amount: convertToRequiredDecimalPlaces(totalAfterAddingFee, 2),
        localAmount: convertToRequiredDecimalPlaces(localAmount, 2),
        type: transaction.type,
        origin: transaction.origin,
        cardNumber: card.last_four,
        exchangeRate: convertToRequiredDecimalPlaces(oneStableCoin, 2),
    };
    const notificationData = { isPomeloUser: pomeloUser, additionalData, pushNotificationPayload, transaction, status: transStatus };

    Event.emit(EventTypes.PomeloCardNotification, notificationData);
};

export default sendNotification;
