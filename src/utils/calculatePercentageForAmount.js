import convertToRequiredDecimalPlaces from "./convertToRequiredDecimalPlaces.js";

const calculatePercentage = (percentage, amount) => convertToRequiredDecimalPlaces(Number((percentage / 100) * amount));
export default calculatePercentage;
