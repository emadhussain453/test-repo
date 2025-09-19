import { ApiError } from "../ApiError.js";
import callApi from "../callApi.js";

const getShipmentDetails = async (shipmentId) => {
    try {
        const params = shipmentId;
        const shipment = await callApi.pomelo("pomelo", "shipment", "GET", false, params, true, null);
        if (!shipment.success) {
            throw new Error(shipment.message);
        }
        return shipment.results.data;
    } catch (error) {
        throw new ApiError("shipment error", 400, error.message, true);
    }
};

export default getShipmentDetails;
