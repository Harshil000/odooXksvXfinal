function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function buildCells(value) {
  const size = 21;
  const hash = hashString(value);
  const cells = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const inFinder =
        (row < 7 && col < 7) ||
        (row < 7 && col >= size - 7) ||
        (row >= size - 7 && col < 7);

      if (inFinder) {
        const localRow = row < 7 ? row : row - (size - 7);
        const localCol = col < 7 ? col : col - (size - 7);
        const isFinder =
          localRow === 0 ||
          localRow === 6 ||
          localCol === 0 ||
          localCol === 6 ||
          (localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4);
        if (isFinder) cells.push({ row, col });
        continue;
      }

      const bit = (hash + row * 17 + col * 31 + row * col) % 5;
      if (bit === 0 || bit === 3) {
        cells.push({ row, col });
      }
    }
  }

  return cells;
}

export function buildAssetCode(product, sequence) {
  const prefix = product.pname
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 6)
    .toUpperCase() || "ASSET";
  const shortProductId = product.p_id.slice(0, 8).toUpperCase();
  return `${prefix}-${shortProductId}-${String(sequence).padStart(3, "0")}`;
}

export function createAssetQrBase64(assetCode) {
  const cellSize = 8;
  const quietZone = 16;
  const matrixSize = 21 * cellSize;
  const imageSize = matrixSize + quietZone * 2;
  const cells = buildCells(assetCode)
    .map(({ row, col }) => (
      `<rect x="${quietZone + col * cellSize}" y="${quietZone + row * cellSize}" width="${cellSize}" height="${cellSize}" />`
    ))
    .join("");

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${imageSize}" height="${imageSize + 38}" viewBox="0 0 ${imageSize} ${imageSize + 38}">`,
    `<rect width="100%" height="100%" fill="#fff"/>`,
    `<g fill="#111">${cells}</g>`,
    `<text x="${imageSize / 2}" y="${imageSize + 22}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#111">${assetCode}</text>`,
    "</svg>",
  ].join("");

  return `data:image/svg+xml;base64,${btoa(svg)}`;
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
