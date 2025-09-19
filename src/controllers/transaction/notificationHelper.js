import { NotificationPriority } from "../../constants/index.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import convertToRequiredDecimalPlaces from "../../utils/convertToRequiredDecimalPlaces.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";

async function sendPushNotificationToBothSenderAndReciever(senderUserAccount, receiverUserAccount, amount, amountPlusFee, additionalDetails) {
   const sendersActiveNotificationTokens = activeNotificationTokenOfUser(senderUserAccount.devices);
   const recieversActiveNotificationTokens = activeNotificationTokenOfUser(receiverUserAccount.devices);

   const sendersTitile = await translateWithLenguageSpecifiedV1(senderUserAccount?.language)("p2p_money_transfer_title_pushNotification");
   const recieversTitile = await translateWithLenguageSpecifiedV1(receiverUserAccount?.language)("p2p_money_received_title_pushNotification");
   const senderFullname = `${senderUserAccount.firstName} ${senderUserAccount.lastName}`;
   const recieverFullname = `${receiverUserAccount.firstName} ${receiverUserAccount.lastName}`;

   const fee = convertToRequiredDecimalPlaces((amountPlusFee - amount), 2);
   await notificationsQueue.add("pushNotification", {
      title: sendersTitile,
      message: await translateWithLenguageSpecifiedV1(senderUserAccount?.language)("sender_message_push_notification", { amount, fee, fullName: recieverFullname, phoneNumber: receiverUserAccount.phoneNumber }),
      tokens: sendersActiveNotificationTokens,
      additionalDetails,
   }, { priority: NotificationPriority.TWO });
   const recieverDetails = {
      ...additionalDetails,
      type: "credit",
      userId: receiverUserAccount._id,
   };
   await notificationsQueue.add("pushNotification", {
      title: recieversTitile,
      message: await translateWithLenguageSpecifiedV1(receiverUserAccount?.language)("receiver_message_push_notification", { amount, fullName: senderFullname, phoneNumber: senderUserAccount.phoneNumber }),
      tokens: recieversActiveNotificationTokens,
      additionalDetails: recieverDetails,
   }, { priority: NotificationPriority.TWO });
}

export default sendPushNotificationToBothSenderAndReciever;
