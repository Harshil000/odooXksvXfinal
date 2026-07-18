import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import httpClient from "../../../shared/api/httpClient";
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
  const [showProductDropdown, setShowProductDropdown] = useState(false);
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
  const [isRentalOrder, setIsRentalOrder] = useState(true);
  const [statusStage, setStatusStage] = useState("Quotation"); // "Quotation", "Quotation Sent", "Sale Order"
  const [startDate, setStartDate] = useState(() => {
    const date = searchParams.get("start_date");
    return date ? `${date}T09:00` : "";
  });
  const [endDate, setEndDate] = useState(() => {
    const date = searchParams.get("end_date") || searchParams.get("start_date");
    return date ? `${date}T18:00` : "";
  });
  const [deliveryStatus, setDeliveryStatus] = useState("reserved");
  const [quantity, setQuantity] = useState(1);

  // Customer & Address State
  const [customerExists, setCustomerExists] = useState(false);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [invoiceAddressId, setInvoiceAddressId] = useState("custom");
  const [deliveryAddressId, setDeliveryAddressId] = useState("custom");
  const [customInvoiceAddress, setCustomInvoiceAddress] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [customDeliveryAddress, setCustomDeliveryAddress] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: ""
  });

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

  // Fetch addresses when customer email is updated
  useEffect(() => {
    if (!email || !email.includes("@")) {
      setCustomerExists(false);
      setCustomerAddresses([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await httpClient.get(`/orders/customer/search?email=${encodeURIComponent(email)}`);
        if (response.data && response.data.exists) {
          setCustomerExists(true);
          const addrs = response.data.addresses || [];
          setCustomerAddresses(addrs);
          if (addrs.length > 0) {
            setInvoiceAddressId(addrs[0].address_id);
            setDeliveryAddressId(addrs[0].address_id);
          } else {
            setInvoiceAddressId("custom");
            setDeliveryAddressId("custom");
          }
        } else {
          setCustomerExists(false);
          setCustomerAddresses([]);
          setInvoiceAddressId("custom");
          setDeliveryAddressId("custom");
        }
      } catch (err) {
        console.error("Error looking up customer addresses:", err);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [email]);

  // Load plans & assets when selected product changes
  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    async function loadDetails() {
      try {
        setLoadingDetails(true);
        const plansResponse = await getRentPlansByProduct(selectedProduct);
        const plans = plansResponse.plans || [];
        setRentPlans(plans);
        if (plans.length > 0) {
          setSelectedPlanId(plans[0].r_id);
        } else {
          setSelectedPlanId("");
        }
        
        const assetsResponse = await getProductAssets(selectedProduct);
        const fetchedAssets = assetsResponse.assets || [];
        setAssets(fetchedAssets);
        if (fetchedAssets.length > 0) {
          setSelectedAssetId(fetchedAssets[0].asset_id);
        } else {
          setSelectedAssetId("");
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoadingDetails(false);
      }
    }

    loadDetails();
  }, [selectedProduct]);

  const selectedPlan = useMemo(() => {
    return rentPlans.find((p) => p.r_id === selectedPlanId) || null;
  }, [selectedPlanId, rentPlans]);

  const durationInfo = useMemo(() => {
    if (!selectedPlan || !startDate || !endDate) return { total: 0, durationLabel: "0 periods" };
    return calculateRentalTotal(startDate, endDate, selectedPlan);
  }, [startDate, endDate, selectedPlan]);

  const untaxedAmount = useMemo(() => {
    return durationInfo.total * quantity;
  }, [durationInfo, quantity]);

  const taxAmount = useMemo(() => {
    return untaxedAmount * 0.10;
  }, [untaxedAmount]);

  const totalAmount = useMemo(() => {
    return untaxedAmount + taxAmount;
  }, [untaxedAmount, taxAmount]);

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

  const executeSave = async (targetStage) => {
    if (!selectedProduct) return alert("Please select a Product.");
    if (!selectedPlanId) return alert("Please select a Rental Plan.");
    if (!email) return alert("Please enter Customer Email.");
    if (!startDate || !endDate) return alert("Please specify start and end dates.");
    if (new Date(endDate) <= new Date(startDate)) return alert("End date must be after Start date.");

    // Validate custom addresses if selected
    if (invoiceAddressId === "custom") {
      if (!customInvoiceAddress.address_line1 || !customInvoiceAddress.city || !customInvoiceAddress.state || !customInvoiceAddress.pincode) {
        return alert("Please complete the custom Invoice Address details.");
      }
    }
    if (deliveryAddressId === "custom") {
      if (!customDeliveryAddress.address_line1 || !customDeliveryAddress.city || !customDeliveryAddress.state || !customDeliveryAddress.pincode) {
        return alert("Please complete the custom Delivery Address details.");
      }
    }

    try {
      setSaving(true);

      let finalAssetId = selectedAssetId;
      if (!finalAssetId) {
        // Auto-create asset QR if none exists
        const qrCode = `${selectedProductDetails?.pname || "product"}-auto-${Date.now().toString().slice(-4)}`;
        const response = await createProductAsset(selectedProduct, qrCode);
        finalAssetId = response.asset.asset_id;
        setSelectedAssetId(finalAssetId);
      }

      let invoice_status = "nothing_to_invoice";
      if (targetStage === "Quotation Sent") {
        invoice_status = "quotation_sent";
      } else if (targetStage === "Sale Order") {
        invoice_status = "confirmed";
      }

      const payload = {
        r_id: selectedPlanId,
        asset_id: finalAssetId,
        email,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        delivery_status: deliveryStatus,
        invoice_status,
        total: Number(totalAmount.toFixed(2)),
        invoice_address_id: invoiceAddressId !== "custom" ? invoiceAddressId : null,
        delivery_address_id: deliveryAddressId !== "custom" ? deliveryAddressId : null,
        invoiceAddress: invoiceAddressId === "custom" ? {
          addressLine1: customInvoiceAddress.address_line1,
          addressLine2: customInvoiceAddress.address_line2,
          city: customInvoiceAddress.city,
          state: customInvoiceAddress.state,
          pincode: customInvoiceAddress.pincode
        } : null,
        deliveryAddress: deliveryAddressId === "custom" ? {
          addressLine1: customDeliveryAddress.address_line1,
          addressLine2: customDeliveryAddress.address_line2,
          city: customDeliveryAddress.city,
          state: customDeliveryAddress.state,
          pincode: customDeliveryAddress.pincode
        } : null,
      };

      await createRentingOrder(payload);
      alert(`Order saved successfully as ${targetStage}!`);
      const backPath = searchParams.get("from") === "schedule" ? "/schedule" : "/dashboard";
      navigate(backPath);
    } catch (err) {
      console.error(err);
      alert("Failed to save renting order: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedProductDetails = useMemo(() => {
    return products.find((p) => p.p_id === selectedProduct) || null;
  }, [selectedProduct, products]);

  const formattedPeriodLabel = useMemo(() => {
    if (!startDate || !endDate) return "";
    const startStr = new Date(startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endStr = new Date(endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${startStr} -> ${endStr}`;
  }, [startDate, endDate]);

  const backPath = searchParams.get("from") === "schedule" ? "/schedule" : "/dashboard";

  return (
    <div className="new-order-page">
      <Navbar activeSection="quotation" searchQuery="" onSearchChange={() => {}} />

      <div className="new-order-content">
        <div className="new-order-form">
          {/* Header Action Row */}
          <div className="form-header-row">
            <div className="title-area">
              <span className="back-link" onClick={() => navigate(backPath)}>
                ← Back
              </span>
              <div className="rental-order-toggle">
                <button type="button" className="btn-new-badge">New</button>
                <label className="rental-label-checkbox">
                  <input 
                    type="checkbox" 
                    checked={isRentalOrder}
                    onChange={(e) => setIsRentalOrder(e.target.checked)}
                  />
                  <span>Rental order</span>
                  {isRentalOrder ? (
                    <span className="check-icon-green" title="Confirmed Rental Mode">✔️</span>
                  ) : (
                    <span className="check-icon-red" title="Draft / Custom Mode">❌</span>
                  )}
                </label>
              </div>
            </div>

            <div className="stages-progress-bar">
              <div className={`stage-step ${statusStage === "Quotation" ? "active" : ""}`} onClick={() => setStatusStage("Quotation")}>
                Quotation
              </div>
              <div className={`stage-step ${statusStage === "Quotation Sent" ? "active" : ""}`} onClick={() => setStatusStage("Quotation Sent")}>
                Quotation Sent
              </div>
              <div className={`stage-step ${statusStage === "Sale Order" ? "active" : ""}`} onClick={() => setStatusStage("Sale Order")}>
                Sale Order
              </div>
            </div>
          </div>

          <div className="sub-actions-row">
            <div className="action-buttons">
              <button 
                type="button" 
                className="btn-send"
                onClick={() => {
                  setStatusStage("Quotation Sent");
                  executeSave("Quotation Sent");
                }}
                disabled={saving}
              >
                Send
              </button>
              <button 
                type="button" 
                className="btn-confirm"
                onClick={() => {
                  setStatusStage("Sale Order");
                  executeSave("Sale Order");
                }}
                disabled={saving}
              >
                Confirm
              </button>
              <button 
                type="button" 
                className="btn-print"
                onClick={handlePrint}
              >
                Print
              </button>
            </div>
          </div>

          <div className="order-sheet">
            <h1 className="order-ref-title">SO00075</h1>

            <div className="form-grid">
              {/* Left Column: Customer and Addresses */}
              <div className="form-column">
                <div className="form-group row-align">
                  <label>Customer</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Invoice Address */}
                <div className="form-group row-align">
                  <label>Invoice Address</label>
                  <select
                    value={invoiceAddressId}
                    onChange={(e) => setInvoiceAddressId(e.target.value)}
                  >
                    {customerAddresses.map((a) => (
                      <option key={a.address_id} value={a.address_id}>
                        {a.address_line1}, {a.city} ({a.pincode})
                      </option>
                    ))}
                    <option value="custom">-- New Custom Address --</option>
                  </select>
                </div>

                {invoiceAddressId === "custom" && (
                  <div className="custom-address-block">
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      required
                      value={customInvoiceAddress.address_line1}
                      onChange={(e) => setCustomInvoiceAddress({...customInvoiceAddress, address_line1: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={customInvoiceAddress.address_line2}
                      onChange={(e) => setCustomInvoiceAddress({...customInvoiceAddress, address_line2: e.target.value})}
                    />
                    <div className="address-subfields">
                      <input
                        type="text"
                        placeholder="City"
                        required
                        value={customInvoiceAddress.city}
                        onChange={(e) => setCustomInvoiceAddress({...customInvoiceAddress, city: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        required
                        value={customInvoiceAddress.state}
                        onChange={(e) => setCustomInvoiceAddress({...customInvoiceAddress, state: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        required
                        value={customInvoiceAddress.pincode}
                        onChange={(e) => setCustomInvoiceAddress({...customInvoiceAddress, pincode: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                <div className="form-group row-align">
                  <label>Delivery Address</label>
                  <select
                    value={deliveryAddressId}
                    onChange={(e) => setDeliveryAddressId(e.target.value)}
                  >
                    {customerAddresses.map((a) => (
                      <option key={a.address_id} value={a.address_id}>
                        {a.address_line1}, {a.city} ({a.pincode})
                      </option>
                    ))}
                    <option value="custom">-- New Custom Address --</option>
                  </select>
                </div>

                {deliveryAddressId === "custom" && (
                  <div className="custom-address-block">
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      required
                      value={customDeliveryAddress.address_line1}
                      onChange={(e) => setCustomDeliveryAddress({...customDeliveryAddress, address_line1: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={customDeliveryAddress.address_line2}
                      onChange={(e) => setCustomDeliveryAddress({...customDeliveryAddress, address_line2: e.target.value})}
                    />
                    <div className="address-subfields">
                      <input
                        type="text"
                        placeholder="City"
                        required
                        value={customDeliveryAddress.city}
                        onChange={(e) => setCustomDeliveryAddress({...customDeliveryAddress, city: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        required
                        value={customDeliveryAddress.state}
                        onChange={(e) => setCustomDeliveryAddress({...customDeliveryAddress, state: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        required
                        value={customDeliveryAddress.pincode}
                        onChange={(e) => setCustomDeliveryAddress({...customDeliveryAddress, pincode: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Dates & Rent Plans Table */}
              <div className="form-column">
                <div className="form-group row-align">
                  <label>Start Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="form-group row-align">
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Delivery Status */}
                <div className="form-group row-align">
                  <label>Delivery Status</label>
                  <select
                    value={deliveryStatus}
                    onChange={(e) => setDeliveryStatus(e.target.value)}
                  >
                    <option value="reserved">Reserved</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="returned">Returned</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Rent Plans Table - shown only after product is selected */}
                {selectedProduct && (
                  <div className="rent-plans-table-section">
                    <h4>Rent Plans for Selected Product</h4>
                    {loadingDetails ? (
                      <div className="table-loading">Loading plans...</div>
                    ) : rentPlans.length === 0 ? (
                      <div className="table-empty">No plans configured for this product.</div>
                    ) : (
                      <table className="plans-table">
                        <thead>
                          <tr>
                            <th>Select</th>
                            <th>Price</th>
                            <th>Period</th>
                            <th>Deposit</th>
                            <th>Penalty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rentPlans.map((rp) => (
                            <tr 
                              key={rp.r_id} 
                              className={selectedPlanId === rp.r_id ? "selected-row" : ""}
                              onClick={() => setSelectedPlanId(rp.r_id)}
                            >
                              <td>
                                <input
                                  type="radio"
                                  name="rent-plan"
                                  checked={selectedPlanId === rp.r_id}
                                  onChange={() => setSelectedPlanId(rp.r_id)}
                                />
                              </td>
                              <td>${Number(rp.price)}</td>
                              <td>{rp.duration_type}</td>
                              <td>${Number(rp.deposit)}</td>
                              <td>${Number(rp.penalty)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Lines Tab Section */}
            <div className="order-lines-section">
              <div className="tabs-bar">
                <span className="tab-title active">Order Line</span>
              </div>

              <table className="order-lines-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Taxes</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProduct ? (
                    <tr>
                      <td className="product-details-cell">
                        <strong>{selectedProductDetails?.pname}</strong>
                        {formattedPeriodLabel && (
                          <span className="period-span"> [{formattedPeriodLabel}]</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="qty-input"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        />
                      </td>
                      <td>Units</td>
                      <td>
                        {selectedPlan ? `$${Number(selectedPlan.price)}` : "No plan selected"}
                      </td>
                      <td>10%</td>
                      <td>
                        ${untaxedAmount.toFixed(2)}
                      </td>
                    </tr>
                  ) : null}

                  {/* Add a Product Option row */}
                  {(!selectedProduct || showProductDropdown) && (
                    <tr>
                      <td colSpan="6" className="product-select-inline-row">
                        <label>Choose Product: </label>
                        {loadingProducts ? (
                          <span>Loading products...</span>
                        ) : (
                          <select
                            value={selectedProduct}
                            onChange={(e) => {
                              handleProductChange(e.target.value);
                              setShowProductDropdown(false);
                            }}
                          >
                            <option value="">-- Choose a Product --</option>
                            {products.map((p) => (
                              <option key={p.p_id} value={p.p_id}>
                                {p.pname} ({p.product_type})
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  )}

                  {!selectedProduct && !showProductDropdown && (
                    <tr>
                      <td colSpan="6" className="add-product-row">
                        <span className="add-product-btn" onClick={() => setShowProductDropdown(true)}>
                          Add a Product
                        </span>
                        <span className="add-note-btn">Add a note</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Summary Breakdown */}
              {selectedProduct && (
                <div className="order-totals-breakdown">
                  <div className="total-row">
                    <span>Untaxed Amount:</span>
                    <strong>${untaxedAmount.toFixed(2)}</strong>
                  </div>
                  <div className="total-row">
                    <span>Taxes (10%):</span>
                    <strong>${taxAmount.toFixed(2)}</strong>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total:</span>
                    <strong>${totalAmount.toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;
