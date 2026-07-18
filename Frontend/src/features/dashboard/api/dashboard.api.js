import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

const ORDERS_BASE = "/orders";

export async function getDashboardOrders() {
  try {
    const response = await httpClient.get(`${ORDERS_BASE}/dashboard`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load dashboard orders");
  }
}

export async function updateOrderStatus(rentId, deliveryStatus) {
  try {
    const response = await httpClient.put(`${ORDERS_BASE}/${rentId}/status`, {
      delivery_status: deliveryStatus,
    });
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to update order status");
  }
}

export async function createRentingOrder(payload) {
  try {
    const response = await httpClient.post(`${ORDERS_BASE}/`, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to create renting order");
  }
}
