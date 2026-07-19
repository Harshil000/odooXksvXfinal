import QRious from "qrious";

export function buildAssetCode(product, sequence) {
  const prefix = product.pname
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase() || "ASSET";
  const shortProductId = product.p_id.slice(0, 4).toUpperCase();
  return `${prefix}-${shortProductId}-${String(sequence).padStart(2, "0")}`;
}

export function createAssetQrBase64(assetCode) {
  try {
    const qr = new QRious({
      value: assetCode,
      size: 320,
      level: "H",
      padding: 20,
    });
    const qrDataUrl = qr.toDataURL();
    
    // Create an SVG wrapping the real QR PNG image and appending the text below
    const width = 360;
    const height = 420;
    const safeAssetCode = String(assetCode).replace(/[<>&'"]/g, (char) => ({
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&#39;",
      '"': "&quot;",
    }[char]));
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `<rect width="100%" height="100%" fill="#ffffff"/>`,
      `<image href="${qrDataUrl}" x="20" y="20" width="320" height="320" />`,
      `<text x="${width / 2}" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111111">${safeAssetCode}</text>`,
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
  if (!qr.startsWith("data:image/svg+xml;base64,")) return String(qr).trim();

  try {
    const svg = atob(qr.replace("data:image/svg+xml;base64,", ""));
    const match = svg.match(/<text[^>]*>([^<]+)<\/text>/);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

export function normalizeAssetCode(value) {
  return readAssetCodeFromQr(value)
    .trim()
    .replace(/^asset:/i, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}
