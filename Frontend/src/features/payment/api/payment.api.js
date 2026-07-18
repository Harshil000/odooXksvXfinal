import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

const PAYMENT_BASE = "/payment";

/**
 * Sends a request to the backend to create a Razorpay Order.
 */
export async function createRazorpayOrder(amount) {
  try {
    const response = await httpClient.post(`${PAYMENT_BASE}/create-order`, { amount });
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to initiate payment");
  }
}

/**
 * Sends payment response parameters (id, order_id, signature) to backend for verification.
 */
export async function verifyPaymentSignature(payload) {
  try {
    const response = await httpClient.post(`${PAYMENT_BASE}/verify`, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to verify payment signature");
  }
}
