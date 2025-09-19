function CheckIfAllRequiredFieldsExists(userFields, requiredFields) {
    const errors = {};
    requiredFields.forEach((field) => {
        if (!userFields[field] || userFields[field] === " ") {
            errors[field] = `${field} is required`;
        }
    });
    if (Object.keys(errors).length > 0) {
        const response = {
            success: false,
            message: `${Object.keys(errors)} are required`,
        };
        return response;
    }
    const response = {
        success: true,
        message: "All required fields exists",
    };
    return response;
}

export default CheckIfAllRequiredFieldsExists;
