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

export async function deleteRentPlan(r_id) {
  try {
    const response = await httpClient.delete(`/rent-plans/${r_id}`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to delete rent plan");
  }
}

