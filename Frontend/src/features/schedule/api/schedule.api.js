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
