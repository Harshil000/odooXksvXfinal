import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Navbar from "../../dashboard/components/Navbar";
import { useAssets } from "../hooks/useAssets";
import { normalizeAssetCode } from "../utils/qr.util";
import "../styles/Assets.scss";

const Assets = () => {
  const {
    products,
    loading,
    error,
    creatingProductId,
    scanQuery,
    setScanQuery,
    matchedAsset,
    createMissingAssets,
    createOneAsset,
  } = useAssets();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedQRAsset, setSelectedQRAsset] = useState(null);
  const [scannedProductModalAsset, setScannedProductModalAsset] = useState(null);
  const [scannerError, setScannerError] = useState("");
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const scannerRef = useRef(null);

  const getProductImageSrc = (product) => {
    const image = product?.image || product?.image_base64 || product?.product_image;
    if (!image) {
      return `https://via.placeholder.com/420x420?text=${encodeURIComponent(product?.name || "Product")}`;
    }

    if (image.startsWith("data:") || image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `data:image/jpeg;base64,${image}`;
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch (err) {
      console.warn("Scanner cleanup failed:", err);
    }
  };

  const findAssetFromScan = (decodedText) => {
    const normalizedScan = normalizeAssetCode(decodedText);
    if (!normalizedScan) return null;

    for (const product of products) {
      const asset = product.assets.find((item) => (
        (item.normalizedCode || normalizeAssetCode(item.code)) === normalizedScan ||
        normalizeAssetCode(item.id) === normalizedScan
      ));

      if (asset) {
        return { product, asset };
      }
    }

    return null;
  };

  const openMatchedAsset = async (decodedText) => {
    const cleanedValue = decodedText.trim();
    const found = findAssetFromScan(cleanedValue);
    setScanQuery(cleanedValue);
    setScannerError("");
    await stopScanner();

    if (found) {
      setScannedProductModalAsset(found);
      setScannerOpen(false);
    } else {
      setScannerError(`QR scanned: "${cleanedValue}", but no matching asset was found.`);
    }
  };

  useEffect(() => {
    if (matchedAsset) {
      setScannedProductModalAsset(matchedAsset);
    }
  }, [matchedAsset]);

  useEffect(() => {
    if (!scannerOpen) return undefined;

    async function startScanner() {
      try {
        setCameraAvailable(true);
        await stopScanner();

        if (!navigator.mediaDevices) {
          setScannerError("Browser security blocking camera: Must use HTTPS or localhost.");
          return;
        }

        const element = document.getElementById("qr-reader");
        if (!element) {
          setScannerError("Scanner UI not loaded properly, please close and reopen.");
          return;
        }

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setScannerError("No cameras found on your device.");
          return;
        }

        const preferredCameras = [
          ...cameras.filter(c => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("environment")),
          ...cameras.filter(c => !(c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("environment"))),
        ];

        let lastError = null;
        for (const camera of preferredCameras) {
          try {
            await stopScanner();
            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;
            await html5QrCode.start(
              camera.id,
              {
                fps: 8,
                qrbox: { width: 240, height: 240 },
                aspectRatio: 1,
              },
              (decodedText) => {
                if (decodedText) {
                  openMatchedAsset(decodedText);
                }
              },
              () => {}
            );
            setScannerError("");
            setCameraAvailable(true);
            return;
          } catch (cameraErr) {
            lastError = cameraErr;
          }
        }

        throw lastError || new Error("Could not start any camera");
      } catch (err) {
        console.error("Camera access failed:", err);
        const errorName = err?.name || "";
        const message = err?.message || errorName || String(err);
        const help = errorName === "NotReadableError" || message.includes("NotReadableError")
          ? "Close other apps/browser tabs using the camera, then click Retry Camera. You can also upload a QR image below."
          : "Allow camera permission, then click Retry Camera. You can also upload a QR image below.";
        setCameraAvailable(false);
        setScannerError(`Camera error: ${message}. ${help}`);
      }
    }

    setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      stopScanner();
    };
  }, [scannerOpen, setScanQuery]);

  const handleQrImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const scanner = new Html5Qrcode("qr-file-reader");
      const decodedText = await scanner.scanFile(file, true);
      scanner.clear();
      await openMatchedAsset(decodedText);
    } catch (err) {
      console.error("QR image scan failed:", err);
      setScannerError("Could not read a QR code from this image. Try a clearer photo or enter the asset code manually.");
    } finally {
      event.target.value = "";
    }
  };

  const handlePrintQR = (asset) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${asset.code}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            img {
              width: 300px;
              height: 300px;
            }
            h1 {
              font-size: 24px;
              margin: 20px 0 10px;
            }
            p {
              font-size: 14px;
              color: #555;
              margin: 0;
            }
            @media print {
              body {
                height: auto;
              }
            }
          </style>
        </head>
        <body>
          <img src="${asset.qr}" alt="QR Code" />
          <h1>Code: ${asset.code}</h1>
          <p>ID: ${asset.id}</p>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQR = (asset) => {
    const img = new Image();
    img.src = asset.qr;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      canvas.width = 400;
      canvas.height = 480;
      
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 50, 20, 300, 300);
      
      ctx.fillStyle = "#000000";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`CODE: ${asset.code}`, 200, 360);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#555555";
      ctx.fillText(`ID: ${asset.id}`, 200, 400);
      
      const jpgUrl = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.href = jpgUrl;
      link.download = `qr_${asset.code}_${asset.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  return (
    <div className="assets-page">
      <Navbar
        activeSection="assets"
        searchQuery=""
        onSearchChange={() => {}}
        searchPlaceholder="Search assets..."
      />

      <main className="assets-content">
        <div className="assets-toolbar">
          <div>
            <h1>Assets</h1>
            <p>Generate QR labels from product quantity and track registered asset items.</p>
          </div>
          <button
            className="scan-qr-btn"
            type="button"
            onClick={() => {
              setScannerError("");
              setScanQuery("");
              setScannerOpen(true);
            }}
          >
            Scan QR Code
          </button>
        </div>

        {error && (
          <div className="assets-error">
            {error.message || "Unable to load assets."}
          </div>
        )}

        {loading ? (
          <div className="assets-loading">Loading assets...</div>
        ) : (
          <div className="assets-grid">
            {products.map((product) => {
              const missingCount = Math.max(0, product.quantity - product.assets.length);

              return (
                <section className="asset-product-card" key={product.id}>
                  <div className="asset-product-card__header">
                    <div>
                      <h2>{product.name}</h2>
                      <span>{product.productType || "Product"} · DB quantity: {product.quantity}</span>
                    </div>
                    <div className="asset-counts">
                      <strong>{product.assets.length}</strong>
                      <span>/ {product.quantity}</span>
                    </div>
                  </div>

                  <div className="asset-progress">
                    <span style={{ width: `${product.quantity ? Math.min(100, (product.assets.length / product.quantity) * 100) : 0}%` }} />
                  </div>

                  <div className="asset-generate-actions">
                    <button
                      className="generate-assets-btn generate-assets-btn--secondary"
                      type="button"
                      disabled={missingCount === 0 || creatingProductId === product.id}
                      onClick={() => createOneAsset(product)}
                    >
                      Generate 1
                    </button>
                    <button
                      className="generate-assets-btn"
                      type="button"
                      disabled={missingCount === 0 || creatingProductId === product.id}
                      onClick={() => createMissingAssets(product)}
                    >
                      {creatingProductId === product.id
                        ? "Generating..."
                        : missingCount > 0
                          ? `Generate Remaining ${missingCount}`
                          : "All Assets Generated"}
                    </button>
                  </div>

                  <div className="asset-list">
                    {product.assets.length === 0 ? (
                      <div className="asset-empty">No assets generated yet.</div>
                    ) : (
                      product.assets.map((asset) => (
                        <article className="asset-row" key={asset.id} onClick={() => setSelectedQRAsset(asset)} style={{ cursor: "pointer" }}>
                          <img src={asset.qr} alt={`${asset.code} QR`} />
                          <div>
                            <strong>{asset.code}</strong>
                            <span>{asset.id}</span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {scannerOpen && (
        <div className="asset-scanner-overlay">
          <section className="asset-scanner">
            <div className="asset-scanner__header">
              <h2>Scan QR Code</h2>
              <button type="button" onClick={() => setScannerOpen(false)}>Close</button>
            </div>

            <div className="camera-scanner">
              <div
                id="qr-reader"
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                  borderRadius: "12px",
                  border: "none",
                  display: cameraAvailable ? "block" : "none",
                }}
              />
              {!cameraAvailable && (
                <div className="camera-fallback-panel">
                  <strong>Camera unavailable</strong>
                  <span>Upload a QR image or enter the asset code manually.</span>
                </div>
              )}
            </div>

            {scannerError && <div className="scanner-error">{scannerError}</div>}

            <div className="scanner-actions">
              <button
                type="button"
                onClick={() => {
                  setScannerError("");
                  stopScanner().then(() => {
                    setScannerOpen(false);
                    setTimeout(() => setScannerOpen(true), 50);
                  });
                }}
              >
                Retry Camera
              </button>
              <label className="scan-upload-btn">
                Upload QR Image
                <input type="file" accept="image/*" onChange={handleQrImageUpload} />
              </label>
              <div id="qr-file-reader" style={{ display: "none" }} />
            </div>

            <label className="manual-scan-field">
              <span>Manual Asset Code</span>
              <input
                type="text"
                value={scanQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  const found = findAssetFromScan(value);
                  setScanQuery(value);
                  if (found) {
                    setScannedProductModalAsset(found);
                    setScannerOpen(false);
                  }
                }}
                placeholder="Paste asset code or asset id"
              />
            </label>

            <div className="scan-result">
              {matchedAsset ? (
                <>
                  <strong>{matchedAsset.asset.code}</strong>
                  <span>{matchedAsset.product.name}</span>
                  <small>{matchedAsset.asset.id}</small>
                </>
              ) : (
                <span>No matching asset selected.</span>
              )}
            </div>
          </section>
        </div>
      )}
      {selectedQRAsset && (
        <div className="qr-modal-overlay" onClick={() => setSelectedQRAsset(null)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setSelectedQRAsset(null)} aria-label="Close modal">&times;</button>
            <div className="qr-modal-image">
              <img src={selectedQRAsset.qr} alt={`${selectedQRAsset.code} QR`} />
            </div>
            <div className="qr-modal-info">
              <h3>CODE: {selectedQRAsset.code}</h3>
              <span>ID: {selectedQRAsset.id}</span>
            </div>
            <div className="qr-modal-actions">
              <button className="print-btn" onClick={() => handlePrintQR(selectedQRAsset)}>Print</button>
              <button className="download-btn" onClick={() => handleDownloadQR(selectedQRAsset)}>Download</button>
            </div>
          </div>
        </div>
      )}
      {scannedProductModalAsset && (
        <div className="product-scan-modal-overlay" onClick={() => { setScannedProductModalAsset(null); setScanQuery(""); }}>
          <div className="product-scan-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => { setScannedProductModalAsset(null); setScanQuery(""); }} aria-label="Close modal">&times;</button>
            <div className="product-scan-details">
              <img
                className="product-scan-img"
                src={getProductImageSrc(scannedProductModalAsset.product)}
                alt={scannedProductModalAsset.product.name}
              />
              <div className="product-scan-info">
                <h2>{scannedProductModalAsset.product.name}</h2>
                <div className="scan-badge-row">
                  <span className="scan-badge type">{scannedProductModalAsset.product.productType || "Product"}</span>
                  <span className="scan-badge price">₹{scannedProductModalAsset.product.sales_price || scannedProductModalAsset.product.price || 0} / per {scannedProductModalAsset.product.duration || "month"}</span>
                </div>
                <p className="scan-desc">
                  {scannedProductModalAsset.product.description || scannedProductModalAsset.product.p_description || "No description provided."}
                </p>
              </div>
            </div>
            
            <div className="matched-asset-section">
              <h4>Matched Asset Info</h4>
              <div className="matched-asset-box">
                <div className="asset-code-group">
                  <strong>{scannedProductModalAsset.asset.code}</strong>
                  <span>ID: {scannedProductModalAsset.asset.id}</span>
                </div>
                <div className="asset-quantities">
                  <strong>{scannedProductModalAsset.product.assets.length} Assets</strong>
                  <span>Stock Qty: {scannedProductModalAsset.product.quantity}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
