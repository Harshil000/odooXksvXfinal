import QRious from "qrious";

export function buildAssetCode(product, sequence) {
  const prefix = product.pname
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 6)
    .toUpperCase() || "ASSET";
  const shortProductId = product.p_id.slice(0, 8).toUpperCase();
  return `${prefix}-${shortProductId}-${String(sequence).padStart(3, "0")}`;
}

export function createAssetQrBase64(assetCode) {
  try {
    const qr = new QRious({
      value: assetCode,
      size: 200,
      level: "M"
    });
    const qrDataUrl = qr.toDataURL();
    
    // Create an SVG wrapping the real QR PNG image and appending the text below
    const width = 230;
    const height = 270;
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `<rect width="100%" height="100%" fill="#ffffff"/>`,
      `<image href="${qrDataUrl}" x="15" y="15" width="200" height="200" />`,
      `<text x="${width / 2}" y="245" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#111111">${assetCode}</text>`,
      "</svg>"
    ].join("");
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    return "";
  }
}

export function readAssetCodeFromQr(qr) {
  if (!qr) return "";
  if (!qr.startsWith("data:image/svg+xml;base64,")) return qr;

  try {
    const svg = atob(qr.replace("data:image/svg+xml;base64,", ""));
    const match = svg.match(/<text[^>]*>([^<]+)<\/text>/);
    return match?.[1] || "";
  } catch {
    return "";
  }
}
