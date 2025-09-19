const addMinutesToCurrentDate = (minutes = 15) => new Date().getTime() + minutes * 60 * 1000;
export default addMinutesToCurrentDate;
