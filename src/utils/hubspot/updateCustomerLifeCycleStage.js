import moment from "moment";
import logger from "../../logger/index.js";
import Users from "../../models/users.js";
import { HubspotCustomerLifecycleStages } from "../../constants/index.js";
import callApi from "../callApi.js";
import getKeyByValue from "../getKeyByValue.js";

const updateCustomerLifeCycleStage = async (payload) => {
    try {
        const { email, stageId } = payload;
        const user = await Users.findOne({ email }).select("hubspot");
        if (!user) {
            logger.error("Hubspot :: user not found");
        }

        //
        const lifeCycleStage = {
            stage: getKeyByValue(HubspotCustomerLifecycleStages, stageId),
            createdAt: moment(),
        };

        const userUpdateQuery = {
            $addToSet: { "hubspot.lifeCycleStage": lifeCycleStage },
        };
        if (!user?.hubspot?.userId) {
            // get user from hubspot
            const params = `${email}/profile`;
            const { success, results } = await callApi.hubspot("hubspot", "getUserDetailsFromEmail", "GET", false, params, true);
            if (!success) {
                throw new Error("Hubspot user Id not found");
            }
            userUpdateQuery.$set = { "hubspot.userId": results.vid };
            // get his customer id
        }
        const userPayload = {
            properties: {
                lifecyclestage: stageId,
            },
        };

        const params = `${userUpdateQuery["hubspot.userId"] ?? user.hubspot.userId}`;
        const { success, results, message } = await callApi.hubspot("hubspot", "getContactDetails", "PATCH", userPayload, params, true);

        if (!success) {
            throw new Error(`Something went wrong ${message}`);
        }
        const { properties: { lifecyclestage } } = results;
        if (lifecyclestage !== stageId.toString()) {
            throw new Error("Lifecycle not updated as the IDs not match");
        }

        await Users.updateOne({ email }, userUpdateQuery);
    } catch (error) {
        logger.error(`Hubsport update event ${error.message}`);
    }
};

export default updateCustomerLifeCycleStage;
