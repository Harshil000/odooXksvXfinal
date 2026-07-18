import { useEffect, useRef, useState } from "react";
import Navbar from "../../dashboard/components/Navbar";
import { useAssets } from "../hooks/useAssets";
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
  const videoRef = useRef(null);

  useEffect(() => {
    if (matchedAsset) {
      setScannedProductModalAsset(matchedAsset);
    }
  }, [matchedAsset]);

  useEffect(() => {
    if (!scannerOpen) return undefined;

    let stream;
    let scanTimer;
    let cancelled = false;

    async function startCameraScanner() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerError("Camera access is not supported in this browser.");
        return;
      }

      if (!("BarcodeDetector" in window)) {
        setScannerError("Live QR scanning is not supported in this browser. Enter the asset code manually.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        scanTimer = window.setInterval(async () => {
          if (!video.videoWidth || !video.videoHeight) return;

          try {
            const codes = await detector.detect(video);
            const rawValue = codes[0]?.rawValue;
            if (rawValue) {
              setScanQuery(rawValue);
              setScannerError("");
            }
          } catch (err) {
            console.error("Camera QR scan failed:", err);
          }
        }, 700);
      } catch (err) {
        console.error("Camera access failed:", err);
        setScannerError("Unable to open camera. Allow camera permission or enter the asset code manually.");
      }
    }

    startCameraScanner();

    return () => {
      cancelled = true;
      if (scanTimer) window.clearInterval(scanTimer);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [scannerOpen, setScanQuery]);

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
              <video ref={videoRef} muted playsInline />
              <div className="camera-frame" />
            </div>

            {scannerError && <div className="scanner-error">{scannerError}</div>}

            <label className="manual-scan-field">
              <span>Manual Asset Code</span>
              <input
                type="text"
                value={scanQuery}
                onChange={(event) => setScanQuery(event.target.value)}
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
              {scannedProductModalAsset.product.image ? (
                <img className="product-scan-img" src={scannedProductModalAsset.product.image} alt={scannedProductModalAsset.product.name} />
              ) : (
                <div className="product-scan-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a22", color: "#71717a", fontSize: "12px" }}>No Image</div>
              )}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
