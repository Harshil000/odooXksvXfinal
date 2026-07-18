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
  const [scannerError, setScannerError] = useState("");
  const videoRef = useRef(null);

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
                        <article className="asset-row" key={asset.id}>
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
    </div>
  );
};

export default Assets;
