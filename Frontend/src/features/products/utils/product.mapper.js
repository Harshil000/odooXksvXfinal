const FALLBACK_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

export function mapProductToCard(product) {
  return {
    id: product.p_id,
    c_id: product.c_id,
    image: product.image || FALLBACK_IMAGE,
    price: `₹${product.sales_price || product.price || 0}`,
    duration: "Month",
    colors: [],
    outOfStock: product.quantity <= 0,
    pname: product.pname,
    to_publish: product.to_publish,
  };
}

export function mapProductDetails(data) {
  return {
    product: data.product,
    image: data.images?.[0]?.image_base64 || "",
    images: data.images?.map(img => img.image_base64) || [],
    variants: data.variants || [],
    attributes: data.attributes || [],
  };
}
