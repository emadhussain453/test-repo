import Users from "../../models/users.js";

const fraudDetectionBlock = async (userId, reason) => {
    try {
        const query = {
            $set: {
                fraudDetection: {
                    softBlock: true,
                    reason,
                },
            },
        };
        await Users.updateOne({ _id: userId }, query);
    } catch (error) {
        throw new Error(error);
    }
};

export default fraudDetectionBlock;
