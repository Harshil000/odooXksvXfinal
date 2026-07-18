import { readAssetCodeFromQr } from "./qr.util";

export function mapProductWithAssets(product, assets) {
  return {
    id: product.p_id,
    name: product.pname,
    quantity: Number(product.quantity || 0),
    productType: product.product_type,
    assets: assets.map((asset, index) => ({
      id: asset.asset_id,
      productId: asset.p_id,
      qr: asset.qr,
      code: readAssetCodeFromQr(asset.qr) || `ASSET-${index + 1}`,
    })),
  };
}
