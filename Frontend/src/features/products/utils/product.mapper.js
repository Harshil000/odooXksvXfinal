const FALLBACK_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

export function mapProductToCard(product) {
  const assetCount = Number(product.asset_count || 0);

  return {
    id: product.p_id,
    image: product.image || FALLBACK_IMAGE,
    price: `₹${product.sales_price || product.price || 0}`,
    duration: "Month",
    colors: [],
    outOfStock: assetCount <= 0,
    assetCount,
    lowOnStock: assetCount > 0 && assetCount < 5,
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
