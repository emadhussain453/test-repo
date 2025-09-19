import { ExpirySeconds } from "../constants/index.js";
import AppConfig from "../models/appConfig.js";
import getFromCache from "./cache/getFromCache.js";
import setToCache from "./cache/setToCache.js";

const getAppConfig = async () => {
    try {
        let app = await getFromCache("app-config");
        if (!app) {
            app = await AppConfig.findOne({});
            if (!app) return false;
            setToCache("app-config", app, ExpirySeconds.h1);
        }
        return app;
    } catch (error) {
        throw new Error(error);
    }
};

export default getAppConfig;
