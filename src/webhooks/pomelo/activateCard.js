import keys from "../../config/keys.js";
import { EventTypes, Lenguages, NotificationPriority, NotificationTitles, NotificationTypes, PomeloCardBLockStatus, PomeloCardTypes, ScoreKeys } from "../../constants/index.js";
import Event from "../../Events/databaseLogs.js";
import { translateWithLenguageSpecifiedV1 } from "../../middlewares/transalations.js";
import PomeloUsers from "../../models/pomeloUser.js";
import Users from "../../models/users.js";
import notificationsQueue from "../../queues/notificationQueue.js";
import { ApiError } from "../../utils/ApiError.js";
import activeNotificationTokenOfUser from "../../utils/Notifications/activeNotificationTokenOfUser.js";
import validateToken from "../../utils/validateToken.js";

const activateCard = async (req, res, next) => {
  try {
    const { t } = req.query;
    if (!t) throw new ApiError("token required", 400, "token not availabe", false);

    const token = `Bearer ${t}`;
    const getToken = validateToken(token, keys.JWT.ACTIVATE_CARD_SECRET);
    if (!getToken.token && getToken?.message) {
      const [errorKey, errorKey2] = getToken?.message.split(" ") || [];
      if (errorKey === "invalid" || errorKey2 === "malformed") throw new ApiError("session_expired", 401, "invalid_token", true);
      if (errorKey === "jwt") throw new ApiError("session_expired", 401, "jwt_expire", true);
      throw new ApiError("Access denied", 401, "something_went_wrong", true);
    }

    const { user: { userId } } = getToken;
    const user = await Users.findOne({ _id: userId }).select("devices language email");
    if (!user) {
      throw new ApiError("Access denied", 401, "user_not_found", true);
    }

    const updateUser = await PomeloUsers.findOneAndUpdate({ userId, "cards.cardType": PomeloCardTypes.PHYSICAL }, { $set: { "cards.$.status": PomeloCardBLockStatus.ACTIVE } }, { new: true });
    if (!updateUser) throw new ApiError("card_status", 401, "card status updation failed", true);

    // send push notification
    const userNotificationTokens = activeNotificationTokenOfUser(user?.devices);
    const title = user.language === Lenguages.Spanish ? `Activación de Tarjeta` : `Card Activation`;
    const message = user.language === Lenguages.Spanish ? `Tu tarjeta física ha sido activada exitosamente.` : `Your physical card has been activated successfully.`;

    await notificationsQueue.add("pushNotification", {
      title,
      message,
      tokens: userNotificationTokens,
    }, { priority: NotificationPriority.THREE });

    // log user notification
    const eventData = {
      userId,
      message: await translateWithLenguageSpecifiedV1(Lenguages.English)("card_activate_successfully"),
      spanishMessage: await translateWithLenguageSpecifiedV1(Lenguages.Spanish)("card_activate_successfully"),
      title: NotificationTitles.Card_Activity,
      type: NotificationTypes.Card_Activity,
    };
    Event.emit(EventTypes.Notification, eventData);
    // user score updated
    const scoreData = {
      userId,
      code: ScoreKeys.ACTIVATE_CARD,
    };
    Event.emit(EventTypes.UpdateUserScore, scoreData);
    const html = `
       <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script type="text/javascript">
    window.ReactNativeWebView.postMessage(JSON.stringify({
      success: true,
      message: 'card activated successfully',
    }));
  </script>
</head>
<body style="background-color: #20201F;">
</body>
</html>`;

    // Send HTML file as response
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Security-Policy", false); // to let browser execute javaascript
    res.status(200).send(html);
  } catch (error) {
    return next(error);
  }
  return true;
};

export default activateCard;
