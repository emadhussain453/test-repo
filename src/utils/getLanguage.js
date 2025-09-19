import { Lenguages } from "../constants/index.js";

function getLanguage(headersLanguage) {
    return Object.values(Lenguages).includes(headersLanguage) ? headersLanguage : Lenguages.Spanish;
}
export default getLanguage;
