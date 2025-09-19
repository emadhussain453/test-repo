import Users from "../../models/users.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import Workflows from "../../models/workflowes.js";
import { PomeloCardBLockStatus, Status, PomeloCardTypes, AiPriseKycStatus, CountryCurrencies } from "../../constants/index.js";
import PomeloUsers from "../../models/pomeloUser.js";

function getLoggedInDevice(devices) {
  return devices.filter((device) => device.loginStatus === true);
}
const Current = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { translate } = req;
    const [dbUser, workflow, card] = await Promise.all([
      Users.findOne({ _id }).populate({ path: "userBalance", select: "userId balance" }),
      Workflows.findOne({ userId: _id }).sort({ createdAt: -1 }).lean(),
      PomeloUsers.findOne({ userId: _id }).lean(),
    ]);

    const user = {
      id: dbUser.id,
      _id: dbUser._id,
      emailVerified: dbUser.emailVerified,
      mobileVerified: dbUser.mobileVerified,
      isBlocked: dbUser.isBlocked,
      kycStatus: dbUser.kycStatus,
      kycAttempts: dbUser?.kycAttempts ?? 0,
      kycvfotu: dbUser?.kycvfotu,
      role: dbUser.role,
      isVerified: dbUser.isVerified,
      createdAt: dbUser.createdAt,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      phoneNumber: dbUser.phoneNumber,
      email: dbUser.email,
      balance: dbUser.userBalance?.balance,
      minimumBalance: dbUser.minimumBalance,
      dateOfBirth: dbUser.dateOfBirth,
      gender: dbUser.gender,
      address: dbUser?.address ?? {},
      isDeleted: dbUser?.isDeleted ?? false,
      language: dbUser?.language,
      devices: dbUser.devices,
      notificationCount: dbUser.notificationCount,
      avatar: dbUser?.avatar ?? null,
      cardShipmentAddress: card?.address ?? {},
      tutorial: dbUser?.tutorial ?? false,
      aiPraise: dbUser?.aiPraise ?? {},
      aiPriseAdditionalDocument: dbUser?.aiPriseAdditionalDocument ?? {},
      fraudDetection: dbUser?.fraudDetection ?? {},
      bankStatementVerification: dbUser.bankStatementVerification || false,
      isBankStatementUploaded: dbUser.isBankStatementUploaded || false,
      onepayCustomerId: dbUser?.onepayCustomerId,

      country: {
        ...dbUser?.country,
        documentCountry: dbUser?.kyc?.countryCode,
        documentType: dbUser?.kyc?.documentType,
        documentNumber: dbUser?.kyc?.documentIdNumber,
      },
      currency: CountryCurrencies[dbUser?.country?.countryCode],

    };
    const [loginDevice] = dbUser.devices.length > 0 ? getLoggedInDevice(dbUser.devices) : [];
    if (loginDevice) user.loginDevice = loginDevice;
    if (dbUser?.passCode) {
      user.passCode = dbUser.passCode;
    }
    if (workflow) {
      user.workflowId = workflow._id;
      user.workflowStatus = workflow.status;
      if (user.kycStatus === 5 && workflow.status === Status.FAILED) {
        user.workFlowFailedMessage = workflow.failedMessage;
      }
    }
    const failedStatues = [AiPriseKycStatus.DECLINED_BY_STABLE, AiPriseKycStatus.DECLINED];
    if (failedStatues.includes(dbUser?.aiPraise?.status)) {
      user.workFlowFailedMessage = dbUser?.aiPraise?.message;
    }
    if (dbUser?.userName) {
      user.userName = dbUser.userName;
    }
    if (card?.cards) {
      const userPhysicalCard = card?.cards.find(({ cardType }) => cardType === PomeloCardTypes.PHYSICAL);
      const userVirtualCard = card?.cards.find(({ cardType }) => cardType === PomeloCardTypes.VIRTUAL);
      if (userPhysicalCard) {
        const isPhysicalCardActive = userPhysicalCard.status === PomeloCardBLockStatus.ACTIVE;
        const physicalCardShipmentStatus = userPhysicalCard?.shipment.status;
        user.hasPhysicalCard = true;
        // user.hasVirtualCard = userVirtualCard && true;
        user.isPhysicalCardActive = isPhysicalCardActive;
        user.physicalCardShipmentStatus = physicalCardShipmentStatus;
      }
      if (userVirtualCard) {
        user.hasVirtualCard = true;
      }
    }
    return sendSuccessResponse(res, 200, true, await translate("user_details_fetched"), null, user);
  } catch (error) {
    next(error);
  }
  return Current;
};
export default Current;
