import axios from "axios";

axios.defaults.headers = {};
axios.defaults.headers["Content-Type"] = "application/json";
// Add the middleware function to the Axios response interceptors
// axios.interceptors.request.use(logRequest);
// axios.interceptors.response.use(logResponse);

export default axios;
