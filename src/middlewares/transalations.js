import i18next from "i18next";
import backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";

i18next
    .use(backend)
    .use(middleware.LanguageDetector)
    .init({
        fallbackLng: "en",
        backend: {
            loadPath: "./locales/{{lng}}/translations.json",
        },
    });

const translateWithLenguageSpecified = (language = "en") => {
    const func = (innerKey, innerOptions = {}) => {
        const originalLanguage = i18next.language;
        const originalBackend = i18next.options.backend;

        // Temporarily change the configuration
        i18next.options.backend.loadPath = `./locales/${language}/translations.json`;
        i18next.changeLanguage(language);

        const translation = i18next.t(innerKey, innerOptions);

        // Restore the original configuration
        i18next.options.backend = originalBackend;
        i18next.changeLanguage(originalLanguage);
        return translation;
    };
    return func;
};

const translateWithLenguageSpecifiedV1 = (language = "en") => {
    async function innerFunction(innerKey, innerOptions = {}) {
        const tempI18next = i18next.createInstance();
        // Configure the backend for this temporary instance
        await tempI18next.use(backend).init({
            backend: {
                loadPath: `./locales/${language}/translations.json`,
            },
            lng: language,
        });

        // Perform translation using the temporary instance
        const translation = tempI18next.t(innerKey, innerOptions);
        tempI18next.services.backendConnector.backend = null;
        return translation;
    }
    return innerFunction;
};

export {
    i18next,
    translateWithLenguageSpecified,
    translateWithLenguageSpecifiedV1,
};
