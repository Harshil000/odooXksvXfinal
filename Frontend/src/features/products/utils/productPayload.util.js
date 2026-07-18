export function buildProductPayload({ companyId, productData, salesData, imagePreviews, attributes }) {
  const payload = {
    c_id: companyId,
    pname: productData.pname,
    description: productData.description || "No description",
    to_publish: productData.to_publish,
    quantity: Number(productData.quantity),
    product_type: salesData.product_type,
    sales_price: Number(salesData.sales_price || 0),
    cost_price: Number(salesData.cost_price || 0),
  };

  if (imagePreviews?.length) {
    payload.images = imagePreviews;
  }

  if (attributes?.length) {
    payload.attributes = attributes;
  }

  return payload;
}
