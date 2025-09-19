import _ from "lodash";

function CheckIfExtraFields(userFields, requiredFields) {
    const extra = (_.omit(userFields, requiredFields));
    return extra;
}

export default CheckIfExtraFields;
