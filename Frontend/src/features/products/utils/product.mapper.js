const FALLBACK_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

export function mapProductToCard(product) {
  return {
    id: product.p_id,
    image: product.image || FALLBACK_IMAGE,
    price: `Rs ${product.sales_price || product.price || 0}`,
    duration: "Month",
    colors: [],
    outOfStock: product.quantity <= 0,
    pname: product.pname,
  };
}

export function mapProductDetails(data) {
  return {
    product: data.product,
    image: data.images?.[0]?.image_base64 || "",
  };
}
