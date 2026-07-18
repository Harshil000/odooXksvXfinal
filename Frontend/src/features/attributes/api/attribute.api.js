import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

export async function getCompanyAttributes(companyId) {
  try {
    const response = await httpClient.get(`/attributes/company/${companyId}`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load attributes");
  }
}

export async function createCompanyAttribute(companyId, payload) {
  try {
    const response = await httpClient.post(`/attributes/company/${companyId}`, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to create attribute");
  }
}

export async function linkAttributeToProduct(productId, payload) {
  try {
    const response = await httpClient.post(`/attributes/product/${productId}`, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to link attribute");
  }
}

export async function createAttributeKey(attributeId, payload) {
  try {
    const response = await httpClient.post(`/attributes/${attributeId}/keys`, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to create attribute key");
  }
}

export async function createAttributeValue(keyId, payload) {
  try {
    const response = await httpClient.post(`/attributes/keys/${keyId}/values`, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to create attribute value");
  }
}
