import { createProduct, getProductById, getProducts, updateProduct, deleteProduct } from "../api/product.api";
import { mapProductDetails, mapProductToCard } from "../utils/product.mapper";

export async function loadProductCards() {
  const data = await getProducts();

  return {
    products: (data.products || []).map(mapProductToCard),
    attributes: data.attributes || [],
  };
}

export async function loadProductDetails(productId) {
  const data = await getProductById(productId);

  return mapProductDetails(data);
}

export async function saveProduct(payload) {
  const response = await createProduct(payload);
  return response.product;
}

export async function publishProduct(product, toPublish) {
  const response = await updateProduct(product.p_id, {
    pname: product.pname,
    description: product.description,
    to_publish: toPublish,
    quantity: product.quantity,
    product_type: product.product_type,
    sales_price: product.sales_price,
    cost_price: product.cost_price,
  });

  return response.product;
}

export async function removeProduct(productId) {
  return await deleteProduct(productId);
}

export async function editProduct(productId, payload) {
  const response = await updateProduct(productId, payload);
  return response.product;
}


