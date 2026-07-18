import { createAssetForProduct, getAssetProducts, getAssetsForProduct } from "../api/assets.api";
import { mapProductWithAssets } from "../utils/asset.mapper";
import { buildAssetCode, createAssetQrBase64 } from "../utils/qr.util";

export async function loadAssetInventory() {
  const productsResponse = await getAssetProducts();
  const products = productsResponse.products || [];

  const rows = await Promise.all(
    products.map(async (product) => {
      const assetsResponse = await getAssetsForProduct(product.p_id);
      return mapProductWithAssets(product, assetsResponse.assets || []);
    }),
  );

  return rows;
}

export async function createAssetsForProduct(product, requestedCount) {
  const missingCount = Math.max(0, product.quantity - product.assets.length);
  const createCount = Math.min(missingCount, Math.max(0, requestedCount));
  const createdAssets = [];

  for (let index = 0; index < createCount; index += 1) {
    const sequence = product.assets.length + index + 1;
    const assetCode = buildAssetCode({ p_id: product.id, pname: product.name }, sequence);
    const qr = createAssetQrBase64(assetCode);
    const response = await createAssetForProduct(product.id, qr);
    createdAssets.push(response.asset);
  }

  return createdAssets;
}

export async function createMissingAssetsForProduct(product) {
  const missingCount = Math.max(0, product.quantity - product.assets.length);
  return createAssetsForProduct(product, missingCount);
}
