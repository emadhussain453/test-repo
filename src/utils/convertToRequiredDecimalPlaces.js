const convertToRequiredDecimalPlaces = (amount, roundOff = 4) => {
    const stringAmount = Number(amount).toFixed(roundOff);
    return Number(stringAmount);
};
export default convertToRequiredDecimalPlaces;
