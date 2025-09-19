import EventEmitter from "events";
import { EventTypes } from "../constants/index.js";
import createuserOnHubspot from "../utils/createUserOnHubspot.js";
import updateCustomerLifeCycleStage from "../utils/hubspot/updateCustomerLifeCycleStage.js";

const HubspotEvents = new EventEmitter();

HubspotEvents.on(EventTypes.CreateUserOnHubspot, createuserOnHubspot);
HubspotEvents.on(EventTypes.UpdateCustomerLifeCycleStage, updateCustomerLifeCycleStage);

export default HubspotEvents;
