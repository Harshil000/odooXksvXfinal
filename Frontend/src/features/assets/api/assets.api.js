import { createProductAsset, getProductAssets, getProducts } from "../../products/api/product.api";

export async function getAssetProducts() {
  return getProducts();
}

export async function getAssetsForProduct(productId) {
  return getProductAssets(productId);
}

export async function createAssetForProduct(productId, qr) {
  return createProductAsset(productId, qr);
}
