import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

export async function getInvoiceOrders() {
  try {
    const response = await httpClient.get("/orders/dashboard");
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load invoice orders");
  }
}

export async function sendInvoice(payload) {
  try {
    const response = await httpClient.post("/orders/invoice/send", payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to send invoice");
  }
}
