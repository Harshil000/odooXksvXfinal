import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

const ORDERS_BASE = "/orders";

export async function getScheduleOrders() {
  try {
    const response = await httpClient.get(`${ORDERS_BASE}/dashboard`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load schedule");
  }
}

export async function getDeliveryRoute(date) {
  try {
    const response = await httpClient.get(`/delivery-routes?date=${date}`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load delivery route");
  }
}

export async function optimizeDeliveryRoute(date) {
  try {
    const response = await httpClient.post("/delivery-routes/optimize", { date });
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to optimize route");
  }
}

export async function updateStopStatus(stop_id, status) {
  try {
    const response = await httpClient.put(`/delivery-routes/stops/${stop_id}`, { status });
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to update stop status");
  }
}
