import saveAndGetuserSecureToken from "../../utils/pomelo/saveAndGetUserSecureToken.js";

const userSecureToken = async (req, res, next) => {
    try {
        const { user: { _id } } = req;
        const resp = await saveAndGetuserSecureToken(_id);
        return res.status(200).send(resp);
    } catch (error) {
        next(error);
    }
    return false;
};

export default userSecureToken;
