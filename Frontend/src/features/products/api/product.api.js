import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

export async function getProducts(params) {
  try {
    const response = await httpClient.get("/products", { params });
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load products");
  }
}

export async function getProductById(productId) {
  try {
    const response = await httpClient.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load product");
  }
}

export async function createProduct(payload) {
  try {
    const response = await httpClient.post("/products", payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to create product");
  }
}

export async function updateProduct(productId, payload) {
  try {
    const response = await httpClient.put(`/products/${productId}`, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to update product");
  }
}

export async function createProductImage(productId, imageBase64) {
  try {
    const response = await httpClient.post(`/products/${productId}/images`, {
      image_base64: imageBase64,
    });
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to upload product image");
  }
}

export async function getProductAssets(productId) {
  try {
    const response = await httpClient.get(`/products/${productId}/assets`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load product assets");
  }
}

export async function createProductAsset(productId, qr) {
  try {
    const response = await httpClient.post(`/products/${productId}/assets`, { qr });
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to create asset");
  }
}

export async function deleteProduct(productId) {
  try {
    const response = await httpClient.delete(`/products/${productId}`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to delete product");
  }
}

