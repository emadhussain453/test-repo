/* eslint-disable require-atomic-updates */
import { translateWithLenguageSpecified, translateWithLenguageSpecifiedV1 } from "./transalations.js";

const applyLanguageMiddleware = (userLanugage, i18nextTranslateFunction, languageFromHeaders) => {
    try {
        let translationFunction = null;
        const userLanguage = userLanugage ?? false;
        const headersLanguage = languageFromHeaders;
        if (userLanguage === headersLanguage) {
            translationFunction = i18nextTranslateFunction;
        } else {
            const check = translateWithLenguageSpecified(userLanguage);
            translationFunction = check;
        }

        return translationFunction;
    } catch (error) {
        throw new Error(error.message);
    }
};

export default applyLanguageMiddleware;
