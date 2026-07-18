import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import httpClient from "../../../shared/api/httpClient";
import { getProducts, getProductAssets, createProductAsset } from "../../products/api/product.api";
import { getRentPlansByProduct } from "../../rentPlans/api/rentPlan.api";
import { createQuotation, fetchQuotationById, confirmQuotation, convertQuotation } from "../api/quotation.api";
import { calculateRentalTotal } from "../services/newOrder.service";
import { getProfile } from "../../profile/services/profile.api";
import Navbar from "../components/Navbar";
import "../styles/NewOrder.scss";

/**
 * Convert any date or ISO string to local YYYY-MM-DDTHH:MM representation in IST timezone (+05:30).
 */
function toISTString(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  // Add +05:30 offset
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const localTime = new Date(date.getTime() + offsetMs);
  return localTime.toISOString().slice(0, 16);
}

/**
 * Parses a local datetime-local value as an explicit IST timezone (+05:30) date, returning its ISO UTC string.
 */
function parseISTToUTC(dateStr) {
  if (!dateStr) return null;
  const hasTimezone = dateStr.includes("Z") || dateStr.match(/[+-]\d{2}:\d{2}$/);
  const targetStr = hasTimezone ? dateStr : `${dateStr}:00+05:30`;
  return new Date(targetStr).toISOString();
}

const NewOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qId = searchParams.get("q_id");

  // Quotation entity details (if viewing an existing one)
  const [quotation, setQuotation] = useState(null);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [rentPlans, setRentPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  
  // Form State
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [statusStage, setStatusStage] = useState("Quotation"); // "Quotation", "Quotation Sent", "Sale Order"
  const [startDate, setStartDate] = useState(() => {
    const date = searchParams.get("start_date");
    return date ? `${date}T09:00` : "";
  });
  const [endDate, setEndDate] = useState(() => {
    const date = searchParams.get("end_date") || searchParams.get("start_date");
    return date ? `${date}T18:00` : "";
  });
  const [quantity, setQuantity] = useState(1);

  // Address State
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

  // Fetch and pre-populate if a q_id is supplied
  useEffect(() => {
    if (!qId) return;

    async function loadQuotationDetails() {
      try {
        setLoadingDetails(true);
        const response = await fetchQuotationById(qId);
        const q = response.quotation;
        setQuotation(q);
        setCustomerName(q.customer_name);
        setEmail(q.customer_email);
        setSelectedProduct(q.p_id);
        setSelectedPlanId(q.r_id);
        setQuantity(q.quantity);

        if (q.start_date) {
          setStartDate(toISTString(q.start_date));
        }
        if (q.end_date) {
          setEndDate(toISTString(q.end_date));
        }

        // Map status to progress steps
        if (q.status === "sent") {
          setStatusStage("Quotation Sent");
        } else if (q.status === "confirmed" || q.status === "converted") {
          setStatusStage("Sale Order");
        } else {
          setStatusStage("Quotation");
        }
      } catch (err) {
        console.error("Failed to load quotation details:", err);
        alert("Error loading quotation details");
      } finally {
        setLoadingDetails(false);
      }
    }

    loadQuotationDetails();
  }, [qId]);

  // Load plans when selected product changes
  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    async function loadPlans() {
      try {
        setLoadingDetails(true);
        const plansResponse = await getRentPlansByProduct(selectedProduct);
        const plans = plansResponse.plans || [];
        setRentPlans(plans);
        // Only override plan selection if not in viewing mode
        if (!qId && plans.length > 0) {
          setSelectedPlanId(plans[0].r_id);
        }
      } catch (err) {
        console.error("Failed to load product plans:", err);
      } finally {
        setLoadingDetails(false);
      }
    }

    loadPlans();
  }, [selectedProduct, qId]);

  // Load company profile address for read-only Invoice Address on mount
  useEffect(() => {
    async function loadCompanyAddress() {
      try {
        const profile = await getProfile();
        if (profile && profile.company) {
          setCustomInvoiceAddress({
            address_line1: profile.company.address_line1 || "",
            address_line2: profile.company.address_line2 || "",
            city: profile.company.city || "",
            state: profile.company.state || "",
            pincode: profile.company.pincode || ""
          });
        }
      } catch (err) {
        console.error("Failed to load company profile address:", err);
      }
    }
    loadCompanyAddress();
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

          if (addrs.length === 1) {
            const addr = addrs[0];
            setDeliveryAddressId(addr.address_id);
            
            // Enter it automatically into the fields of delivery address only
            setCustomDeliveryAddress({
              address_line1: addr.address_line1 || "",
              address_line2: addr.address_line2 || "",
              city: addr.city || "",
              state: addr.state || "",
              pincode: addr.pincode || ""
            });
          } else if (addrs.length > 1) {
            setDeliveryAddressId(addrs[0].address_id);
            
            // Pre-populate fields with first address values
            const firstAddr = addrs[0];
            setCustomDeliveryAddress({
              address_line1: firstAddr.address_line1 || "",
              address_line2: firstAddr.address_line2 || "",
              city: firstAddr.city || "",
              state: firstAddr.state || "",
              pincode: firstAddr.pincode || ""
            });
          } else {
            setDeliveryAddressId("custom");
          }
        } else {
          setCustomerExists(false);
          setCustomerAddresses([]);
          setDeliveryAddressId("custom");
        }
      } catch (err) {
        console.error("Error looking up customer addresses:", err);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [email]);

  const handleInvoiceAddressChange = (addrId) => {
    setInvoiceAddressId(addrId);
    if (addrId === "custom") {
      setCustomInvoiceAddress({
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        pincode: ""
      });
    } else {
      const selected = customerAddresses.find(a => a.address_id === addrId);
      if (selected) {
        setCustomInvoiceAddress({
          address_line1: selected.address_line1 || "",
          address_line2: selected.address_line2 || "",
          city: selected.city || "",
          state: selected.state || "",
          pincode: selected.pincode || ""
        });
      }
    }
  };

  const handleDeliveryAddressChange = (addrId) => {
    setDeliveryAddressId(addrId);
    if (addrId === "custom") {
      setCustomDeliveryAddress({
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        pincode: ""
      });
    } else {
      const selected = customerAddresses.find(a => a.address_id === addrId);
      if (selected) {
        setCustomDeliveryAddress({
          address_line1: selected.address_line1 || "",
          address_line2: selected.address_line2 || "",
          city: selected.city || "",
          state: selected.state || "",
          pincode: selected.pincode || ""
        });
      }
    }
  };

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
  };

  // Date limit checks
  const minDateTime = useMemo(() => {
    return toISTString(new Date());
  }, []);

  const validateDates = () => {
    const now = new Date();
    const startUTC = new Date(parseISTToUTC(startDate));
    const endUTC = new Date(parseISTToUTC(endDate));
    
    if (startUTC < now) {
      alert("Start date and time cannot be in the past.");
      return false;
    }
    if (endUTC <= startUTC) {
      alert("End date must be after Start date.");
      return false;
    }
    return true;
  };

  const validateAddresses = () => {
    // Custom addresses validation
    if (invoiceAddressId === "custom") {
      if (!customInvoiceAddress.address_line1 || !customInvoiceAddress.city || !customInvoiceAddress.state || !customInvoiceAddress.pincode) {
        alert("Please complete the custom Invoice Address details.");
        return false;
      }
    }
    if (deliveryAddressId === "custom") {
      if (!customDeliveryAddress.address_line1 || !customDeliveryAddress.city || !customDeliveryAddress.state || !customDeliveryAddress.pincode) {
        alert("Please complete the custom Delivery Address details.");
        return false;
      }
    }
    return true;
  };

  // ─── Quotation Actions ────────────────────────────────────

  const handleSendQuotation = async () => {
    if (!selectedProduct) return alert("Please select a Product.");
    if (!selectedPlanId) return alert("Please select a Rental Plan.");
    if (!customerName) return alert("Please enter Customer Name.");
    if (!email) return alert("Please enter Customer Email.");
    if (!startDate || !endDate) return alert("Please specify start and end dates.");
    if (!validateDates()) return;
    if (!validateAddresses()) return;

    try {
      setSaving(true);
      const payload = {
        p_id: selectedProduct,
        r_id: selectedPlanId,
        customer_name: customerName,
        customer_email: email,
        quantity: Number(quantity),
        start_date: parseISTToUTC(startDate),
        end_date: parseISTToUTC(endDate),
        total: Number(totalAmount.toFixed(2)),
        status: "sent",
        invoice_address_id: null,
        delivery_address_id: deliveryAddressId !== "custom" ? deliveryAddressId : null,
        invoiceAddress: {
          addressLine1: customInvoiceAddress.address_line1,
          addressLine2: customInvoiceAddress.address_line2,
          address_line1: customInvoiceAddress.address_line1,
          address_line2: customInvoiceAddress.address_line2,
          city: customInvoiceAddress.city,
          state: customInvoiceAddress.state,
          pincode: customInvoiceAddress.pincode
        },
        deliveryAddress: deliveryAddressId === "custom" ? {
          addressLine1: customDeliveryAddress.address_line1,
          addressLine2: customDeliveryAddress.address_line2,
          address_line1: customDeliveryAddress.address_line1,
          address_line2: customDeliveryAddress.address_line2,
          city: customDeliveryAddress.city,
          state: customDeliveryAddress.state,
          pincode: customDeliveryAddress.pincode
        } : null
      };

      await createQuotation(payload);
      alert("Quotation successfully created and sent to customer!");
      navigate("/dashboard/quotation");
    } catch (err) {
      console.error(err);
      alert("Failed to create quotation: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmQuotation = async () => {
    try {
      setSaving(true);
      await confirmQuotation(qId);
      setStatusStage("Sale Order");
      alert("Quotation confirmed successfully!");
      // Reload updated details
      const response = await fetchQuotationById(qId);
      setQuotation(response.quotation);
    } catch (err) {
      console.error(err);
      alert("Failed to confirm quotation: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleConvertQuotation = async () => {
    if (!validateAddresses()) return;

    try {
      setSaving(true);
      const addressPayload = {
        invoice_address_id: null,
        delivery_address_id: deliveryAddressId !== "custom" ? deliveryAddressId : null,
        invoiceAddress: {
          addressLine1: customInvoiceAddress.address_line1,
          addressLine2: customInvoiceAddress.address_line2,
          address_line1: customInvoiceAddress.address_line1,
          address_line2: customInvoiceAddress.address_line2,
          city: customInvoiceAddress.city,
          state: customInvoiceAddress.state,
          pincode: customInvoiceAddress.pincode
        },
        deliveryAddress: deliveryAddressId === "custom" ? {
          addressLine1: customDeliveryAddress.address_line1,
          addressLine2: customDeliveryAddress.address_line2,
          address_line1: customDeliveryAddress.address_line1,
          address_line2: customDeliveryAddress.address_line2,
          city: customDeliveryAddress.city,
          state: customDeliveryAddress.state,
          pincode: customDeliveryAddress.pincode
        } : null
      };

      const response = await convertQuotation(qId, addressPayload);
      alert(`Quotation successfully converted to active Rental Order #${response.order.rent_id}!`);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to convert quotation: " + (err.message || err));
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

  const isConverted = quotation?.status === "converted";
  const isConfirmed = quotation?.status === "confirmed";
  const isSent = quotation?.status === "sent";

  const backPath = searchParams.get("from") === "schedule" ? "/schedule" : "/dashboard/quotation";

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
              <button type="button" className="btn-new-badge">
                {qId ? `REF #Q-${qId}` : "New"}
              </button>
            </div>

            <div className="stages-progress-bar">
              <div className={`stage-step ${statusStage === "Quotation" ? "active" : ""}`}>
                Quotation
              </div>
              <div className={`stage-step ${statusStage === "Quotation Sent" ? "active" : ""}`}>
                Quotation Sent
              </div>
              <div className={`stage-step ${statusStage === "Sale Order" ? "active" : ""}`}>
                Rental Order
              </div>
            </div>
          </div>

          <div className="sub-actions-row">
            <div className="action-buttons">
              {/* 1. Send Quotation Button (New creation state) */}
              {!qId && (
                <button 
                  type="button" 
                  className="btn-send"
                  onClick={handleSendQuotation}
                  disabled={saving}
                >
                  Send Quotation
                </button>
              )}

              {/* 2. Confirm Button (Quotation Sent state) */}
              {qId && isSent && (
                <button 
                  type="button" 
                  className="btn-confirm"
                  onClick={handleConfirmQuotation}
                  disabled={saving}
                >
                  Confirm
                </button>
              )}

              {/* 3. Convert Button (Confirmed state) */}
              {qId && isConfirmed && (
                <button 
                  type="button" 
                  className="btn-confirm"
                  onClick={handleConvertQuotation}
                  disabled={saving}
                >
                  Convert to Rental Order
                </button>
              )}

              <button 
                type="button" 
                className="btn-print"
                onClick={handlePrint}
              >
                Print
              </button>
            </div>
          </div>

          {isConverted && (
            <div className="quotation-converted-banner">
              ✓ This quotation has been successfully converted into active Rental Order #{quotation.rent_id}.
            </div>
          )}

          <div className="order-sheet">
            <h1 className="order-ref-title">
              {qId ? `Quotation #Q-${qId}` : "New Quotation"}
            </h1>

            <div className="form-grid">
              {/* Left Column: Customer details & Addresses */}
              <div className="form-column">
                <div className="form-group row-align">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isConverted}
                  />
                </div>

                <div className="form-group row-align">
                  <label>Customer Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isConverted}
                  />
                </div>

                {/* Invoice Address Block */}
                <div className="form-group row-align" style={{ marginTop: "16px" }}>
                  <label>Invoice Address (Company Address)</label>
                  <span style={{ color: "#a1a1aa", fontSize: "12px", fontStyle: "italic" }}>
                    Billed from company location
                  </span>
                </div>

                {/* Company Address Fields (Always Disabled) */}
                <div className="custom-address-block" style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Company Address Line 1"
                    value={customInvoiceAddress.address_line1}
                    disabled={true}
                    style={{ padding: "6px 12px", background: "#1a1a24", border: "1px solid #27272a", borderRadius: "4px", color: "#a1a1aa" }}
                  />
                  <input
                    type="text"
                    placeholder="Company Address Line 2"
                    value={customInvoiceAddress.address_line2}
                    disabled={true}
                    style={{ padding: "6px 12px", background: "#1a1a24", border: "1px solid #27272a", borderRadius: "4px", color: "#a1a1aa" }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="City"
                      value={customInvoiceAddress.city}
                      disabled={true}
                      style={{ flex: 1, padding: "6px 12px", background: "#1a1a24", border: "1px solid #27272a", borderRadius: "4px", color: "#a1a1aa" }}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={customInvoiceAddress.state}
                      disabled={true}
                      style={{ flex: 1, padding: "6px 12px", background: "#1a1a24", border: "1px solid #27272a", borderRadius: "4px", color: "#a1a1aa" }}
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={customInvoiceAddress.pincode}
                      disabled={true}
                      style={{ flex: 1, padding: "6px 12px", background: "#1a1a24", border: "1px solid #27272a", borderRadius: "4px", color: "#a1a1aa" }}
                    />
                  </div>
                </div>

                {/* Delivery Address Select Dropdown */}
                <div className="form-group row-align" style={{ marginTop: "24px" }}>
                  <label>Delivery Address</label>
                  {customerAddresses.length > 0 ? (
                    <select
                      value={deliveryAddressId}
                      onChange={(e) => handleDeliveryAddressChange(e.target.value)}
                      disabled={isConverted}
                      style={{ padding: "6px 12px", background: "#0f0f14", border: "1px solid #27272a", borderRadius: "4px", color: "#fff" }}
                    >
                      {customerAddresses.map((a) => (
                        <option key={a.address_id} value={a.address_id}>
                          {a.address_line1}, {a.city} ({a.pincode})
                        </option>
                      ))}
                      <option value="custom">-- New Custom Address --</option>
                    </select>
                  ) : (
                    <span style={{ color: "#a1a1aa", fontSize: "12px" }}>Custom Address inputs below</span>
                  )}
                </div>

                {/* Custom Delivery Address Fields */}
                <div className="custom-address-block" style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Delivery Address Line 1"
                    required
                    value={customDeliveryAddress.address_line1}
                    onChange={(e) => setCustomDeliveryAddress({...customDeliveryAddress, address_line1: e.target.value})}
                    disabled={isConverted || deliveryAddressId !== "custom"}
                    style={{ padding: "6px 12px", background: "#0f0f14", border: "1px solid #27272a", borderRadius: "4px", color: "#fff" }}
                  />
                  <input
                    type="text"
                    placeholder="Delivery Address Line 2 (Optional)"
                    value={customDeliveryAddress.address_line2}
                    onChange={(e) => setCustomDeliveryAddress({...customDeliveryAddress, address_line2: e.target.value})}
                    disabled={isConverted || deliveryAddressId !== "custom"}
                    style={{ padding: "6px 12px", background: "#0f0f14", border: "1px solid #27272a", borderRadius: "4px", color: "#fff" }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="City"
                      required
                      value={customDeliveryAddress.city}
                      onChange={(e) => setCustomDeliveryAddress({...customDeliveryAddress, city: e.target.value})}
                      disabled={isConverted || deliveryAddressId !== "custom"}
                      style={{ flex: 1, padding: "6px 12px", background: "#0f0f14", border: "1px solid #27272a", borderRadius: "4px", color: "#fff" }}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      required
                      value={customDeliveryAddress.state}
                      onChange={(e) => setCustomDeliveryAddress({...customDeliveryAddress, state: e.target.value})}
                      disabled={isConverted || deliveryAddressId !== "custom"}
                      style={{ flex: 1, padding: "6px 12px", background: "#0f0f14", border: "1px solid #27272a", borderRadius: "4px", color: "#fff" }}
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      required
                      value={customDeliveryAddress.pincode}
                      onChange={(e) => setCustomDeliveryAddress({...customDeliveryAddress, pincode: e.target.value})}
                      disabled={isConverted || deliveryAddressId !== "custom"}
                      style={{ flex: 1, padding: "6px 12px", background: "#0f0f14", border: "1px solid #27272a", borderRadius: "4px", color: "#fff" }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Dates */}
              <div className="form-column">
                <div className="form-group row-align">
                  <label>Start Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isConverted}
                    min={minDateTime}
                  />
                </div>

                <div className="form-group row-align">
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isConverted}
                    min={startDate || minDateTime}
                  />
                </div>
              </div>
            </div>

            {/* Rent Plans Selection Section */}
            {selectedProduct && (
              <div className="rent-plans-table-section" style={{ marginTop: "24px" }}>
                <h4 style={{ marginBottom: "12px", fontSize: "14px", color: "#a1a1aa" }}>Rent Plans for Selected Product</h4>
                {loadingDetails ? (
                  <div className="table-loading" style={{ color: "#a1a1aa" }}>Loading plans...</div>
                ) : rentPlans.length === 0 ? (
                  <div className="table-empty" style={{ color: "#a1a1aa" }}>No plans configured for this product.</div>
                ) : (
                  <table className="plans-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid #27272a" }}>
                        <th style={{ padding: "8px" }}>Select</th>
                        <th style={{ padding: "8px" }}>Price</th>
                        <th style={{ padding: "8px" }}>Period</th>
                        <th style={{ padding: "8px" }}>Deposit</th>
                        <th style={{ padding: "8px" }}>Penalty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentPlans.map((rp) => (
                        <tr 
                          key={rp.r_id} 
                          className={selectedPlanId === rp.r_id ? "selected-row" : ""}
                          onClick={() => {
                            if (!isConverted) setSelectedPlanId(rp.r_id);
                          }}
                          style={{
                            borderBottom: "1px solid #1f1f24",
                            cursor: isConverted ? "default" : "pointer",
                            background: selectedPlanId === rp.r_id ? "rgba(192, 132, 252, 0.08)" : "transparent"
                          }}
                        >
                          <td style={{ padding: "8px" }}>
                            <input
                              type="radio"
                              name="rent-plan"
                              checked={selectedPlanId === rp.r_id}
                              onChange={() => {
                                if (!isConverted) setSelectedPlanId(rp.r_id);
                              }}
                              disabled={isConverted}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>${Number(rp.price)}</td>
                          <td style={{ padding: "8px" }}>{rp.duration_type}</td>
                          <td style={{ padding: "8px" }}>${Number(rp.deposit)}</td>
                          <td style={{ padding: "8px" }}>${Number(rp.penalty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Order Lines Tab Section */}
            <div className="order-lines-section" style={{ marginTop: "24px" }}>
              <div className="tabs-bar" style={{ borderBottom: "1px solid #27272a", marginBottom: "12px" }}>
                <span className="tab-title active" style={{ display: "inline-block", paddingBottom: "8px", borderBottom: "2px solid #c084fc", fontWeight: "600", fontSize: "14px" }}>Order Line</span>
              </div>

              <table className="order-lines-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #27272a" }}>
                    <th style={{ padding: "8px" }}>Product</th>
                    <th style={{ padding: "8px" }}>Quantity</th>
                    <th style={{ padding: "8px" }}>Unit</th>
                    <th style={{ padding: "8px" }}>Unit Price</th>
                    <th style={{ padding: "8px" }}>Taxes</th>
                    <th style={{ padding: "8px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProduct ? (
                    <tr style={{ borderBottom: "1px solid #1f1f24" }}>
                      <td className="product-details-cell" style={{ padding: "8px" }}>
                        <strong>{selectedProductDetails?.pname}</strong>
                        {formattedPeriodLabel && (
                          <span className="period-span" style={{ color: "#a1a1aa", fontSize: "12px", marginLeft: "8px" }}> [{formattedPeriodLabel}]</span>
                        )}
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="number"
                          min="1"
                          className="qty-input"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                          disabled={isConverted}
                          style={{
                            width: "60px",
                            padding: "4px 8px",
                            background: "#0f0f14",
                            border: "1px solid #27272a",
                            borderRadius: "4px",
                            color: "#fff"
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>Units</td>
                      <td style={{ padding: "8px" }}>
                        {selectedPlan ? `$${Number(selectedPlan.price)}` : "No plan selected"}
                      </td>
                      <td style={{ padding: "8px" }}>10%</td>
                      <td style={{ padding: "8px" }}>
                        ${untaxedAmount.toFixed(2)}
                      </td>
                    </tr>
                  ) : null}

                  {/* Add a Product Option row */}
                  {(!selectedProduct || showProductDropdown) && !isConverted && (
                    <tr>
                      <td colSpan="6" className="product-select-inline-row" style={{ padding: "12px 8px" }}>
                        <label style={{ marginRight: "8px" }}>Choose Product: </label>
                        {loadingProducts ? (
                          <span>Loading products...</span>
                        ) : (
                          <select
                            value={selectedProduct}
                            onChange={(e) => {
                              handleProductChange(e.target.value);
                              setShowProductDropdown(false);
                            }}
                            style={{
                              padding: "6px 12px",
                              background: "#0f0f14",
                              border: "1px solid #27272a",
                              borderRadius: "4px",
                              color: "#fff"
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

                  {!selectedProduct && !showProductDropdown && !isConverted && (
                    <tr>
                      <td colSpan="6" className="add-product-row" style={{ padding: "12px 8px" }}>
                        <span 
                          className="add-product-btn" 
                          onClick={() => setShowProductDropdown(true)}
                          style={{ color: "#c084fc", cursor: "pointer", marginRight: "16px", fontWeight: "600" }}
                        >
                          Add a Product
                        </span>
                        <span className="add-note-btn" style={{ color: "#a1a1aa", cursor: "pointer" }}>Add a note</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Summary Breakdown */}
              {selectedProduct && (
                <div className="order-totals-breakdown" style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <div className="total-row" style={{ display: "flex", gap: "24px", fontSize: "14px" }}>
                    <span style={{ color: "#a1a1aa" }}>Untaxed Amount:</span>
                    <strong>${untaxedAmount.toFixed(2)}</strong>
                  </div>
                  <div className="total-row" style={{ display: "flex", gap: "24px", fontSize: "14px" }}>
                    <span style={{ color: "#a1a1aa" }}>Taxes (10%):</span>
                    <strong>${taxAmount.toFixed(2)}</strong>
                  </div>
                  <div className="total-row grand-total" style={{ display: "flex", gap: "24px", fontSize: "16px", borderTop: "1px solid #27272a", paddingTop: "8px" }}>
                    <span>Total:</span>
                    <strong style={{ color: "#c084fc" }}>${totalAmount.toFixed(2)}</strong>
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
