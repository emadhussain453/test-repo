function CheckIfAllRequiredFieldsArePresent(userFields, requiredFields) {
    const errors = {};
    requiredFields.forEach((field) => {
        if (!userFields[field]) {
            errors[field] = `${field} is required`;
        }
    });
    return errors;
}

export default CheckIfAllRequiredFieldsArePresent;
