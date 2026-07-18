import { createProduct, getProductById, getProducts, updateProduct } from "../api/product.api";
import { mapProductDetails, mapProductToCard } from "../utils/product.mapper";

export async function loadProductCards() {
  const data = await getProducts();

  return (data.products || []).map(mapProductToCard);
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
