import moment from "moment";

function getStatusHistoryObject(status, initial = false) {
    const obj = {
        status,
        time: moment().utc(),
    };

    if (initial) {
        return [obj];
    } return obj;
}

export default getStatusHistoryObject;
