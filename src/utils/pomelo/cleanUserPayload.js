const cleanUserPayload = (fiieldsToRemove, fieldsToRemoveFrom) => {
    const cleanedObject = {};
    for (const key in fieldsToRemoveFrom) {
        if (!fiieldsToRemove.includes(key)) {
            cleanedObject[key] = fieldsToRemoveFrom[key];
        }
    }
    return cleanedObject;
};

export default cleanUserPayload;
