import isValidMdbId from "./isValidMdbId.js";

function filterValidIds(ids) {
    const validIds = ids.filter(isValidMdbId);
    return validIds;
}

export default filterValidIds;
