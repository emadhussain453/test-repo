import moment from "moment";
import axios from "axios";
import logger from "../logger/index.js";
import keys from "../config/keys.js";
import { HubspotCustomerLifecycleStages } from "../constants/index.js";
import Users from "../models/users.js";
import getKeyByValue from "./getKeyByValue.js";

const createuserOnHubspot = async (userDetails) => {
    try {
        const { email } = userDetails;
        const userPayload = {
            properties: {
                ...userDetails,
                lifecyclestage: HubspotCustomerLifecycleStages.HOT_LEAD,
            },
        };

        const url = `${keys.HUPSPOT.BASE_URL}crm/v3/objects/contacts`;
        const headers = {
            Authorization: `Bearer ${keys.HUPSPOT.ACCESS_TOKEN}`,
        };

        const config = { method: "POST", url, data: userPayload, headers };
        const { data } = await axios(config);

        const lifeCycleStage = {
            stage: getKeyByValue(HubspotCustomerLifecycleStages, HubspotCustomerLifecycleStages.HOT_LEAD),
            createdAt: moment(),
        };

        await Users.updateOne({ email }, {
            $set: { "hubspot.userId": data?.id },
            $push: {
                "hubspot.lifeCycleStage": lifeCycleStage,
            },
        });
    } catch (error) {
        logger.error(`User created on hubspot Event ${error.message}}`);
    }
};

export default createuserOnHubspot;
