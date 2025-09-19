import Payees from "../models/payees.js";

async function createPayee(userId, recieverDetails, favourite) {
    try {
        const payee = await Payees.findOne({ userId, payeeUserId: recieverDetails._id });
        if (payee) {
            throw new Error("Payee already exists");
        }
        // create a new payee
        const newPayee = new Payees({
            userId,
            payeeUserId: recieverDetails._id,
            firstName: recieverDetails.firstName,
            lastName: recieverDetails.lastName,
            phoneNumber: recieverDetails.phoneNumber,
            favourite,
        });
        const Payee = await newPayee.save();
        return Payee;
    } catch (error) {
        throw new Error(error.message);
    }
}

export default createPayee;
