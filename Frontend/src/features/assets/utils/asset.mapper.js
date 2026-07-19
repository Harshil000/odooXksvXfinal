import { readAssetCodeFromQr, createAssetQrBase64 } from "./qr.util";

export function mapProductWithAssets(product, assets) {
  return {
    ...product,
    id: product.p_id,
    name: product.pname,
    quantity: Number(product.quantity || 0),
    productType: product.product_type,
    assets: assets.map((asset, index) => {
      const code = readAssetCodeFromQr(asset.qr) || `ASSET-${index + 1}`;
      const freshQr = createAssetQrBase64(code);
      return {
        id: asset.asset_id,
        productId: asset.p_id,
        qr: freshQr,
        code,
        currentOrder: asset.rent_id ? {
          rentId: asset.rent_id,
          customerId: asset.customer_id,
          customerName: [asset.customer_first_name, asset.customer_last_name].filter(Boolean).join(" ") || "Customer",
          customerEmail: asset.customer_email,
          startDate: asset.start_date,
          endDate: asset.end_date,
          deliveryStatus: asset.delivery_status,
          invoiceStatus: asset.invoice_status,
          total: asset.total,
        } : null,
      };
    }),
  };
}
