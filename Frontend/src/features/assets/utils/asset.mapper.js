import { createAssetQrBase64, normalizeAssetCode, readAssetCodeFromQr } from "./qr.util";

export function mapProductWithAssets(product, assets) {
  return {
    ...product,
    id: product.p_id,
    name: product.pname,
    quantity: Number(product.quantity || 0),
    productType: product.product_type,
    assets: assets.map((asset, index) => {
      const code = readAssetCodeFromQr(asset.qr) || `ASSET-${index + 1}`;
      const qrBase64 = createAssetQrBase64(code);
      return {
        id: asset.asset_id,
        productId: asset.p_id,
        qr: qrBase64,
        code: code,
        normalizedCode: normalizeAssetCode(code),
      };
    }),
  };
}
