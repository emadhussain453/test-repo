import moment from "moment";

const getExpiry = (userExpiry) => {
    const current = moment();
    const userNameExpiry = moment(userExpiry);
    const duration = moment.duration(userNameExpiry.diff(current));
    const message = `Please wait for ${duration.days()} days, ${duration.hours()} hours  dbefore requesting for another userName`;
    return message;
};
export default getExpiry;
