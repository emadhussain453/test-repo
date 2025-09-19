import { ApiError } from "../ApiError.js";
import callApi from "../callApi.js";

const getUserSecureToken = async (userId) => {
    try {
        const body = {
            user_id: userId,
        };
        const sercureToken = await callApi.pomelo("pomelo", "secureToken", "POST", body, false, true, false);
        if (!sercureToken.success) {
            throw new ApiError("Invalid request", 400, sercureToken.message, true);
        }
        const { results } = sercureToken;
        return results;
    } catch (error) {
        throw new Error(error.message);
    }
};

export default getUserSecureToken;
