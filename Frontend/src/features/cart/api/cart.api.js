import httpClient, { getErrorPayload } from "../../../shared/api/httpClient";

const CART_BASE = "/cart";

export async function fetchCart() {
  try {
    const response = await httpClient.get(CART_BASE);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to load cart items");
  }
}

export async function addItemToCart(payload) {
  try {
    const response = await httpClient.post(CART_BASE, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to add product to cart");
  }
}

export async function updateCartItem(cartItemId, payload) {
  try {
    const response = await httpClient.put(`${CART_BASE}/${cartItemId}`, payload);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to update cart item");
  }
}

export async function deleteCartItem(cartItemId) {
  try {
    const response = await httpClient.delete(`${CART_BASE}/${cartItemId}`);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to remove item from cart");
  }
}

export async function clearUserCart() {
  try {
    const response = await httpClient.delete(CART_BASE);
    return response.data;
  } catch (error) {
    throw getErrorPayload(error, "Unable to clear cart");
  }
}
