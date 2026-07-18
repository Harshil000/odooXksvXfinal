import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

export async function getReportOrders() {
  try {
    const response = await httpClient.get("/orders/dashboard");
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load report orders");
  }
}
