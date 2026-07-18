import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

export async function getRentPlansByProduct(productId) {
  try {
    const response = await httpClient.get(`/rent-plans/product/${productId}`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load rent plans");
  }
}

export async function createRentPlan(productId, payload) {
  try {
    const response = await httpClient.post(`/rent-plans/product/${productId}`, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to create rent plan");
  }
}
