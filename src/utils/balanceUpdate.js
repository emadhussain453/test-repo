import { CountryCurrencies } from "../constants/index.js";
import logger from "../logger/index.js";
import UserBalance from "../models/userBalance.js";
import Users from "../models/users.js";
import { triggerBalanceUpdateEvent } from "../pubsub/publishers.js";
import { ApiError } from "./ApiError.js";
import getExchangeRate from "./exchangeRates/getExchangeRate.js";

const updateBalance = async (userId, amount, extraPayload) => {
    try {
        const { opts } = extraPayload;
        if (!userId) throw new ApiError("Validation Error", 400, "userId_required", true);
        if (amount === null || amount === undefined) throw new ApiError("Validation Error", 400, "amount_required", true);
        const updatedBalance = await UserBalance.findOneAndUpdate(
            { userId },
            { $inc: { balance: amount } },
            { ...opts, new: true },
        );
        if (!updatedBalance) {
            const errorMessage = "Error_updating_balance";
            throw new ApiError("Balance Update Error", 400, errorMessage, true);
        }
        try {
            const dbUser = await Users.findOne({ _id: updatedBalance.userId });
            if (!dbUser) throw new ApiError("Invalid Details", 400, "user_not_found", true);
            const { countryCode } = dbUser.country;
            const userUpdatedBalance = updatedBalance.balance;
            const exchangeRates = await getExchangeRate(CountryCurrencies[countryCode]);
            const userUpdatedBalanceLocal = userUpdatedBalance * exchangeRates.selling;
            await triggerBalanceUpdateEvent(dbUser.email, { _id: dbUser._id, balance: userUpdatedBalance, localBalance: userUpdatedBalanceLocal });
        } catch (error) {
            logger.info("Error while sending Event", error);
        }

        return updatedBalance;
    } catch (error) {
        throw new ApiError("Balance Update Error", 400, error.message, true);
    }
};

export default updateBalance;
