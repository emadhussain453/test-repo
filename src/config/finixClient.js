import { Client, Environment } from "@finix-payments/finix";
import ENV from "./keys.js";

const userName = ENV.FINIX.USERNAME;
const password = ENV.FINIX.PASSWORD;
let applicationEnvironment = Environment.Sandbox;

if (process.env.NODE_ENV === "production") applicationEnvironment = Environment.Live;

const finixClient = new Client(userName, password, applicationEnvironment);
export default finixClient;
