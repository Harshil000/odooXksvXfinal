import QRious from "qrious";

export function buildAssetCode(product, sequence) {
  const prefix = product.pname
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase() || "AST";
  // Generate a very short code (e.g. LAPT-001) which is 8 characters long
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

export function createAssetQrBase64(assetCode) {
  const qr = new QRious({
    value: assetCode,
    size: 250,
    level: "H" // High error correction for easier camera scanning
  });
  return qr.toDataURL();
}

export function readAssetCodeFromQr(qr) {
  if (!qr) return "";
  
  if (qr.startsWith("data:image/svg+xml;base64,")) {
    try {
      const svg = atob(qr.replace("data:image/svg+xml;base64,", ""));
      const match = svg.match(/<text[^>]*>([^<]+)<\/text>/);
      return match?.[1] || "";
    } catch {
      return "";
    }
  }

  // If it is any other data URL (e.g. mistakenly saved PNG base64), reject it
  if (qr.startsWith("data:")) {
    return "";
  }

  return qr;
}

export function normalizeAssetCode(value) {
  return readAssetCodeFromQr(String(value || ""))
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}
