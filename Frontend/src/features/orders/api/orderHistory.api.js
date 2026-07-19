import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

export async function getMyOrderHistory() {
  try {
    const response = await httpClient.get("/orders/history/me");
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load order history");
  }
}
