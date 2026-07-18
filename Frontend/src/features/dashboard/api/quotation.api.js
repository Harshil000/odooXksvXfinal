import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

const QUOTATIONS_BASE = "/quotations";

/**
 * Creates a new quotation (status = 'sent') and sends the quotation email.
 */
export async function createQuotation(payload) {
  try {
    const response = await httpClient.post(QUOTATIONS_BASE, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Failed to create quotation");
  }
}

/**
 * Retrieves all quotations created by the vendor's company.
 */
export async function fetchQuotations() {
  try {
    const response = await httpClient.get(QUOTATIONS_BASE);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Failed to load quotations");
  }
}

/**
 * Retrieves details of a single quotation by ID.
 */
export async function fetchQuotationById(q_id) {
  try {
    const response = await httpClient.get(`${QUOTATIONS_BASE}/${q_id}`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Failed to load quotation details");
  }
}

/**
 * Confirms a quotation (updates status to 'confirmed').
 */
export async function confirmQuotation(q_id) {
  try {
    const response = await httpClient.put(`${QUOTATIONS_BASE}/${q_id}/confirm`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Failed to confirm quotation");
  }
}

/**
 * Converts a confirmed quotation into an active rental order.
 */
export async function convertQuotation(q_id, addressData = {}) {
  try {
    const response = await httpClient.post(`${QUOTATIONS_BASE}/${q_id}/convert`, addressData);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Failed to convert quotation to rental order");
  }
}
