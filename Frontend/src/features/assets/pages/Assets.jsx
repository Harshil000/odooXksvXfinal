import { useEffect, useRef, useState } from "react";
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
  const [jsQRLoaded, setJsQRLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const productsRef = useRef(products);

  // Keep ref in sync so camera callback can read latest products
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const formatScanDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const findScannedAsset = (value) => {
    const normalizedValue = normalizeAssetCode(value);
    if (!normalizedValue) return null;

    for (const product of productsRef.current) {
      const asset = product.assets.find((item) => {
        const normalizedCode = item.normalizedCode || normalizeAssetCode(item.code);
        const normalizedId = normalizeAssetCode(item.id);
        return normalizedCode === normalizedValue || normalizedId === normalizedValue;
      });
      if (asset) return { product, asset };
    }

    return null;
  };

  const scanCanvasForQr = (canvas, ctx, video, cropScale = 1) => {
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const cropWidth = Math.floor(sourceWidth * cropScale);
    const cropHeight = Math.floor(sourceHeight * cropScale);
    const sourceX = Math.floor((sourceWidth - cropWidth) / 2);
    const sourceY = Math.floor((sourceHeight - cropHeight) / 2);

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    ctx.drawImage(video, sourceX, sourceY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const imageData = ctx.getImageData(0, 0, cropWidth, cropHeight);
    return window.jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
  };

  // When matchedAsset changes (from manual input), open the result modal
  useEffect(() => {
    if (matchedAsset) {
      setScannedProductModalAsset(matchedAsset);
    }
  }, [matchedAsset]);

  // Load jsQR script once when scanner is first opened
  useEffect(() => {
    if (!scannerOpen) return;

    if (window.jsQR) {
      setJsQRLoaded(true);
      return;
    }

    if (!document.getElementById("jsqr-script")) {
      const script = document.createElement("script");
      script.id = "jsqr-script";
      script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
      script.async = true;
      script.onload = () => setJsQRLoaded(true);
      document.body.appendChild(script);
    } else {
      // Script tag already exists but may still be loading
      const interval = setInterval(() => {
        if (window.jsQR) {
          clearInterval(interval);
          setJsQRLoaded(true);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [scannerOpen]);

  // Camera scanning effect
  useEffect(() => {
    if (!scannerOpen || !jsQRLoaded) return undefined;

    let stream;
    let scanRequestFrame;
    let cancelled = false;
    setCameraReady(false);

    async function startCameraScanner() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerError("Camera access is not supported in this browser.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute("playsinline", true);
        await video.play();
        setCameraReady(true);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const scanFrame = () => {
          if (cancelled) return;

          if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            const code = [1, 0.82, 0.64, 0.46]
              .map((cropScale) => scanCanvasForQr(canvas, ctx, video, cropScale))
              .find(Boolean);

            if (code && code.data) {
              const scannedValue = code.data.trim();
              console.log("[Scanner] QR detected:", scannedValue);

              const found = findScannedAsset(scannedValue);

              if (found) {
                // Stop camera and show result immediately
                cancelled = true;
                if (scanRequestFrame) cancelAnimationFrame(scanRequestFrame);
                if (stream) stream.getTracks().forEach((t) => t.stop());

                setScannedProductModalAsset(found);
                setScanQuery(scannedValue);
                setScannerOpen(false);
                setScannerError("");
              } else {
                // QR detected but no match — show it as feedback
                setScannerError(`QR scanned: "${scannedValue}" — no matching asset found. Keep scanning or enter manually.`);
              }
            }
          }

          scanRequestFrame = requestAnimationFrame(scanFrame);
        };

        scanRequestFrame = requestAnimationFrame(scanFrame);
      } catch (err) {
        console.error("Camera access failed:", err);
        setScannerError(
          "Unable to open camera. Allow camera permission or enter the asset code manually."
        );
      }
    }

    startCameraScanner();

    return () => {
      cancelled = true;
      if (scanRequestFrame) cancelAnimationFrame(scanRequestFrame);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setCameraReady(false);
    };
  }, [scannerOpen, jsQRLoaded, setScanQuery]);

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
            📷 Scan QR Code
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
                      <span>{product.productType || "Product"} · Qty: {product.quantity}</span>
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

      {/* Camera Scanner Modal */}
      {scannerOpen && (
        <div className="asset-scanner-overlay">
          <section className="asset-scanner">
            <div className="asset-scanner__header">
              <h2>📷 Scan QR Code</h2>
              <button type="button" onClick={() => setScannerOpen(false)}>✕ Close</button>
            </div>

            <div className="camera-scanner">
              <video ref={videoRef} muted playsInline autoPlay style={{ width: "100%", borderRadius: "8px" }} />
              <div className="camera-frame" />
            </div>

            {!cameraReady && !scannerError && (
              <div style={{ textAlign: "center", color: "#a1a1aa", padding: "8px 0", fontSize: "13px" }}>
                {jsQRLoaded ? "Starting camera..." : "Loading scanner library..."}
              </div>
            )}

            {cameraReady && !scannerError && (
              <div style={{ textAlign: "center", color: "#22c55e", padding: "8px 0", fontSize: "13px" }}>
                ✓ Camera active — point at a QR code
              </div>
            )}

            {scannerError && <div className="scanner-error">{scannerError}</div>}

            <label className="manual-scan-field">
              <span>Or enter Asset Code manually</span>
              <input
                type="text"
                value={scanQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setScanQuery(value);
                  const found = findScannedAsset(value);
                  if (found) {
                    setScannedProductModalAsset(found);
                    setScannerOpen(false);
                  }
                }}
                placeholder="Paste asset code or asset id"
                autoFocus={false}
              />
            </label>

            {matchedAsset && (
              <div className="scan-result" style={{ color: "#22c55e" }}>
                <strong>{matchedAsset.asset.code}</strong>
                <span>{matchedAsset.product.name}</span>
                <button
                  type="button"
                  style={{ marginTop: "6px", padding: "6px 14px", background: "#7c3aed", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}
                  onClick={() => {
                    setScannedProductModalAsset(matchedAsset);
                    setScannerOpen(false);
                  }}
                >
                  View Details →
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* QR Image Modal (click on asset row) */}
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
            <div className="matched-customer-section">
              <h4>Customer Rental</h4>
              {selectedQRAsset.currentOrder ? (
                <div className="matched-customer-box">
                  <strong>{selectedQRAsset.currentOrder.customerName}</strong>
                  <span>{selectedQRAsset.currentOrder.customerEmail}</span>
                  <span>Order #{selectedQRAsset.currentOrder.rentId}</span>
                  <span>{formatScanDate(selectedQRAsset.currentOrder.startDate)} - {formatScanDate(selectedQRAsset.currentOrder.endDate)}</span>
                  <span>Status: {selectedQRAsset.currentOrder.deliveryStatus}</span>
                </div>
              ) : (
                <div className="matched-customer-empty">This asset is not assigned to an active customer rental.</div>
              )}
            </div>
            <div className="qr-modal-actions">
              <button className="print-btn" onClick={() => handlePrintQR(selectedQRAsset)}>Print</button>
              <button className="download-btn" onClick={() => handleDownloadQR(selectedQRAsset)}>Download</button>
            </div>
          </div>
        </div>
      )}

      {/* Scanned Asset Detail Modal */}
      {scannedProductModalAsset && (
        <div className="product-scan-modal-overlay" onClick={() => { setScannedProductModalAsset(null); setScanQuery(""); }}>
          <div className="product-scan-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => { setScannedProductModalAsset(null); setScanQuery(""); }} aria-label="Close modal">&times;</button>
            <div className="product-scan-details">
            {(() => {
              const raw = scannedProductModalAsset.product.image;
              const imgSrc = raw
                ? raw.startsWith("data:")
                  ? raw
                  : `data:image/jpeg;base64,${raw}`
                : null;
              return imgSrc ? (
                <img className="product-scan-img" src={imgSrc} alt={scannedProductModalAsset.product.name} />
              ) : (
                <div className="product-scan-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a22", color: "#71717a", fontSize: "12px" }}>No Image</div>
              );
            })()}
              <div className="product-scan-info">
                <h2>{scannedProductModalAsset.product.name}</h2>
                <div className="scan-badge-row">
                  <span className="scan-badge type">{scannedProductModalAsset.product.productType || "Product"}</span>
                  <span className="scan-badge price">₹{scannedProductModalAsset.product.price} / per {scannedProductModalAsset.product.duration || "month"}</span>
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

            <div className="matched-customer-section">
              <h4>Customer Details</h4>
              {scannedProductModalAsset.asset.currentOrder ? (
                <div className="matched-customer-box">
                  <strong>{scannedProductModalAsset.asset.currentOrder.customerName}</strong>
                  <span>{scannedProductModalAsset.asset.currentOrder.customerEmail}</span>
                  <span>Rental Order #{scannedProductModalAsset.asset.currentOrder.rentId}</span>
                  <span>Rental: {formatScanDate(scannedProductModalAsset.asset.currentOrder.startDate)} - {formatScanDate(scannedProductModalAsset.asset.currentOrder.endDate)}</span>
                  <span>Delivery: {scannedProductModalAsset.asset.currentOrder.deliveryStatus}</span>
                  <span>Invoice: {scannedProductModalAsset.asset.currentOrder.invoiceStatus}</span>
                </div>
              ) : (
                <div className="matched-customer-empty">No active customer is assigned to this asset.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
