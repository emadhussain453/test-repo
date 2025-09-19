/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
const validateInputs = (joiSchema, dataToValidate, translate) => {
    const { error, value } = joiSchema.validate(dataToValidate);
    const extraFields = [];
    const errorMessage = error?.details?.map((err) => {
    if (err.type === "object.unknown") {
        extraFields.push(err.context.key);
    } else return translate(err.message);
});
if (extraFields.length > 0) errorMessage.push(translate("extra_fields", { Fields: extraFields }));
    if (errorMessage) {
        return {
            error: true,
            errorMessage: errorMessage.join(""),
        };
    }

    return false;
};

export default validateInputs;
