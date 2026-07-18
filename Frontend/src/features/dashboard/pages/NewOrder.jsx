import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getProducts, getProductAssets, createProductAsset } from "../../products/api/product.api";
import { getRentPlansByProduct } from "../../rentPlans/api/rentPlan.api";
import { createRentingOrder } from "../api/dashboard.api";
import { calculateRentalTotal } from "../services/newOrder.service";
import Navbar from "../components/Navbar";
import "../styles/NewOrder.scss";

const NewOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [rentPlans, setRentPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  
  // Custom asset creation
  const [newAssetQr, setNewAssetQr] = useState("");
  const [showAssetInput, setShowAssetInput] = useState(false);
  const [assetLoading, setAssetLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const date = searchParams.get("start_date");
    return date ? `${date}T09:00` : "";
  });
  const [endDate, setEndDate] = useState(() => {
    const date = searchParams.get("end_date") || searchParams.get("start_date");
    return date ? `${date}T18:00` : "";
  });
  const [deliveryStatus, setDeliveryStatus] = useState("reserved");
  const [invoiceStatus, setInvoiceStatus] = useState("nothing_to_invoice");
  const [total, setTotal] = useState(0);
  const [isManualTotal, setIsManualTotal] = useState(false);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load products on mount
  useEffect(() => {
    async function loadProductsList() {
      try {
        const response = await getProducts();
        setProducts(response.products || []);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProductsList();
  }, []);

  // Load plans & assets when selected product changes
  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    async function loadDetails() {
      try {
        setLoadingDetails(true);
        // Fetch plans
        const plansResponse = await getRentPlansByProduct(selectedProduct);
        setRentPlans(plansResponse.plans || []);
        
        // Fetch assets
        const assetsResponse = await getProductAssets(selectedProduct);
        setAssets(assetsResponse.assets || []);
      } catch (err) {
        console.error("Failed to load product rent details:", err);
      } finally {
        setLoadingDetails(false);
      }
    }

    loadDetails();
  }, [selectedProduct]);

  const calculatedTotal = useMemo(() => {
    const plan = rentPlans.find((p) => p.r_id === selectedPlanId);
    if (!plan || !startDate || !endDate) {
      return 0;
    }

    const { total: calculated } = calculateRentalTotal(startDate, endDate, plan);
    return calculated;
  }, [startDate, endDate, selectedPlanId, rentPlans]);

  const orderTotal = isManualTotal ? total : calculatedTotal;

  const handleProductChange = (productId) => {
    setSelectedProduct(productId);
    setRentPlans([]);
    setSelectedPlanId("");
    setAssets([]);
    setSelectedAssetId("");
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qrCode = newAssetQr.trim() || `${products.find(p => p.p_id === selectedProduct)?.pname || "product"}-asset-${Date.now().toString().slice(-4)}`;
    
    try {
      setAssetLoading(true);
      const response = await createProductAsset(selectedProduct, qrCode);
      const newAsset = response.asset;
      setAssets((prev) => [...prev, newAsset]);
      setSelectedAssetId(newAsset.asset_id);
      setNewAssetQr("");
      setShowAssetInput(false);
    } catch (err) {
      alert("Failed to create asset: " + (err.message || err));
    } finally {
      setAssetLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) return alert("Please select a Rental Plan.");
    if (!selectedAssetId) return alert("Please assign an Asset.");
    if (!email) return alert("Please enter Customer Email.");
    if (!startDate || !endDate) return alert("Please specify start and end dates.");
    if (new Date(endDate) <= new Date(startDate)) return alert("End date must be after Start date.");

    try {
      setSaving(true);
      const payload = {
        r_id: selectedPlanId,
        asset_id: selectedAssetId,
        email,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        delivery_status: deliveryStatus,
        invoice_status: invoiceStatus,
        total: Number(orderTotal),
      };

      await createRentingOrder(payload);
      alert("Rental order created successfully!");
      navigate(searchParams.get("from") === "schedule" ? "/schedule" : "/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to create renting order: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const selectedPlan = rentPlans.find((p) => p.r_id === selectedPlanId);
  const backPath = searchParams.get("from") === "schedule" ? "/schedule" : "/dashboard";

  return (
    <div className="new-order-page">
      <Navbar activeSection={backPath === "/schedule" ? "schedule" : "orders"} searchQuery="" onSearchChange={() => {}} />

      <div className="new-order-content">
        <form onSubmit={handleSave} className="new-order-form">
          {/* Header Action Row */}
          <div className="form-header-row">
            <div className="title-area">
              <span className="back-link" onClick={() => navigate(backPath)}>
                ← Back to Dashboard
              </span>
              <h2>Create Rental Order</h2>
            </div>
            <div className="action-buttons">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => navigate(backPath)}
                disabled={saving}
              >
                Discard
              </button>
              <button 
                type="submit" 
                className="btn-save" 
                disabled={saving || loadingProducts || loadingDetails}
              >
                {saving ? "Creating..." : "Save Order"}
              </button>
            </div>
          </div>

          <div className="form-grid">
            {/* Left Column: Customer & Product Info */}
            <div className="form-card-column">
              <div className="form-card-section">
                <h3>Customer Details</h3>
                <div className="form-group">
                  <label htmlFor="customer-email">Customer Email *</label>
                  <input
                    type="email"
                    id="customer-email"
                    required
                    placeholder="e.g. customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-card-section">
                <h3>Product & Rental Plan</h3>
                <div className="form-group">
                  <label htmlFor="product-select">Select Product *</label>
                  {loadingProducts ? (
                    <div className="select-loading">Loading products list...</div>
                  ) : (
                    <select
                      id="product-select"
                      required
                      value={selectedProduct}
                      onChange={(e) => handleProductChange(e.target.value)}
                    >
                      <option value="">-- Choose a Product --</option>
                      {products.map((p) => (
                        <option key={p.p_id} value={p.p_id}>
                          {p.pname} ({p.product_type})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedProduct && (
                  <div className="form-group">
                    <label htmlFor="plan-select">Rental Plan *</label>
                    {loadingDetails ? (
                      <div className="select-loading">Loading rent plans...</div>
                    ) : rentPlans.length === 0 ? (
                      <div className="error-note">No rental plans configured for this product. Configure one first.</div>
                    ) : (
                      <select
                        id="plan-select"
                        required
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                      >
                        <option value="">-- Choose a Rental Plan --</option>
                        {rentPlans.map((rp) => (
                          <option key={rp.r_id} value={rp.r_id}>
                            ${Number(rp.price)} per {rp.duration_type} (Deposit: ${Number(rp.deposit)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {selectedPlan && (
                  <div className="plan-summary-box">
                    <div className="summary-item">
                      <span>Rate:</span> <strong>${Number(selectedPlan.price)} / {selectedPlan.duration_type}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Security Deposit:</span> <strong>${Number(selectedPlan.deposit)}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Late Penalty Rate:</span> <strong>${Number(selectedPlan.penalty)} / period</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Dates, Pricing & Asset Assignment */}
            <div className="form-card-column">
              <div className="form-card-section">
                <h3>Rental Dates & Pricing</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start-date">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      id="start-date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="end-date">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      id="end-date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="delivery-status">Delivery Status</label>
                    <select
                      id="delivery-status"
                      value={deliveryStatus}
                      onChange={(e) => setDeliveryStatus(e.target.value)}
                    >
                      <option value="reserved">Reserved</option>
                      <option value="picked_up">Picked Up</option>
                      <option value="returned">Returned</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="invoice-status">Invoice Status</label>
                    <select
                      id="invoice-status"
                      value={invoiceStatus}
                      onChange={(e) => setInvoiceStatus(e.target.value)}
                    >
                      <option value="nothing_to_invoice">Nothing to Invoice</option>
                      <option value="quotation_sent">Quotation Sent</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="invoiced">Invoiced</option>
                    </select>
                  </div>
                </div>

                <div className="total-calculation-area">
                  <div className="total-label-row">
                    <label htmlFor="total-amount">Total Amount ($)</label>
                    {isManualTotal && (
                      <span className="reset-autocalc" onClick={() => setIsManualTotal(false)}>
                        ↻ Reset to Auto-calc
                      </span>
                    )}
                  </div>
                  <div className="total-input-wrapper">
                    <input
                      type="number"
                      id="total-amount"
                      min="0"
                      step="0.01"
                      value={orderTotal}
                      onChange={(e) => {
                        setIsManualTotal(true);
                        setTotal(Number(e.target.value));
                      }}
                    />
                    <span className="total-calc-hint">
                      {isManualTotal ? "Manual override active" : "Auto-calculated price"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-card-section">
                <h3>Asset Assignment</h3>
                {selectedProduct ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="asset-select">Assign Asset Item *</label>
                      {loadingDetails ? (
                        <div className="select-loading">Loading assets list...</div>
                      ) : assets.length === 0 ? (
                        <div className="empty-assets-note">
                          <span>No assets registered for this product.</span>
                          <button
                            type="button"
                            className="btn-quick-asset"
                            onClick={() => setShowAssetInput(true)}
                          >
                            + Register Asset QR
                          </button>
                        </div>
                      ) : (
                        <div className="asset-selector-row">
                          <select
                            id="asset-select"
                            required
                            value={selectedAssetId}
                            onChange={(e) => setSelectedAssetId(e.target.value)}
                          >
                            <option value="">-- Choose Asset Item --</option>
                            {assets.map((a) => (
                              <option key={a.asset_id} value={a.asset_id}>
                                {a.qr}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn-quick-asset-small"
                            onClick={() => setShowAssetInput(true)}
                            title="Add new asset"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {showAssetInput && (
                      <div className="quick-asset-input-box">
                        <h4>Register New Asset Item</h4>
                        <div className="asset-input-row">
                          <input
                            type="text"
                            placeholder="e.g. QR-00124 (Leave blank for auto-gen)"
                            value={newAssetQr}
                            onChange={(e) => setNewAssetQr(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-save-asset"
                            disabled={assetLoading}
                            onClick={handleCreateAsset}
                          >
                            {assetLoading ? "Registering..." : "Add"}
                          </button>
                          <button
                            type="button"
                            className="btn-cancel-asset"
                            onClick={() => setShowAssetInput(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="info-note">Please select a product first to view or register assets.</div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOrder;
