import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { createRazorpayOrder, verifyPaymentSignature } from "../../payment/api/payment.api";
import { getProfile } from "../../profile/services/profile.api";
import "../styles/CartDrawer.scss";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount) {
  return `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { cartItems, totals, updateQty, removeItem, clearCart } = useCart();
  
  // Checkout States
  const [step, setStep] = useState("cart"); // "cart" | "checkout"
  const [profile, setProfile] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [addressForm, setAddressForm] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep("cart");
      setIsProcessing(false);
      // Prefill user details if logged in
      getProfile()
        .then((data) => {
          setProfile(data);
          if (data?.user?.email) {
            setEmail(data.user.email);
          }
          if (data?.addresses?.length > 0) {
            setSelectedAddressId(data.addresses[0].address_id);
          } else {
            setSelectedAddressId("new");
          }
        })
        .catch((err) => {
          console.warn("[CartDrawer] User profile fetch failed (unauthenticated):", err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProceedToCheckout = () => {
    if (!profile) {
      alert("Please log in to proceed with checkout.");
      navigate("/login");
      onClose();
      return;
    }
    setStep("checkout");
  };

  const handlePayment = async () => {
    let finalAddress = null;

    if (selectedAddressId === "new") {
      if (
        !addressForm.address_line1.trim() ||
        !addressForm.city.trim() ||
        !addressForm.state.trim() ||
        !addressForm.pincode.trim()
      ) {
        alert("Please fill in all mandatory address fields.");
        return;
      }
      finalAddress = addressForm;
    } else {
      const saved = profile?.addresses?.find((a) => a.address_id === selectedAddressId);
      if (saved) {
        finalAddress = {
          address_line1: saved.address_line1,
          address_line2: saved.address_line2,
          city: saved.city,
          state: saved.state,
          pincode: saved.pincode,
        };
      }
    }

    if (!email.trim()) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      setIsProcessing(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load Razorpay SDK. Please check your internet connection.");
        return;
      }

      // 1. Create order on backend
      const orderData = await createRazorpayOrder(totals.grandTotal);
      const { key_id, order } = orderData;

      // 2. Configure Razorpay options
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Zenith Rental",
        description: `Rental payment for ${cartItems.length} items`,
        order_id: order.id,
        handler: async function (response) {
          try {
            setIsProcessing(true);
            const verifyPayload = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              email: email.trim(),
              address: finalAddress,
              cartItems: cartItems.map((item) => ({
                p_id: item.productId,
                r_id: item.planId,
                startDate: item.startDate,
                endDate: item.endDate,
                quantity: item.quantity,
                subtotal: item.subtotal,
                deposit: item.deposit,
              })),
            };

            await verifyPaymentSignature(verifyPayload);

            alert("Payment Verified! Your rental booking is confirmed.");
            clearCart();
            setStep("cart");
            onClose();
            navigate("/schedule"); // Redirect user to schedule view
          } catch (err) {
            console.error(err);
            alert("Verification failed: " + (err.message || "Failed to verify payment signature"));
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: profile?.user ? `${profile.user.first_name} ${profile.user.last_name}` : "",
          email: email.trim(),
        },
        theme: {
          color: "#22c55e",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Error initiating checkout: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="title-section">
            {step === "checkout" ? (
              <button className="btn-back" onClick={() => setStep("cart")}>
                <ArrowLeft size={18} />
              </button>
            ) : (
              <ShoppingBag size={20} className="accent-icon" />
            )}
            <h3>{step === "checkout" ? "Secure Checkout" : "Your Rental Cart"}</h3>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="cart-drawer-content">
          {step === "cart" ? (
            cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <ShoppingBag size={48} className="empty-icon" />
                <p>Your cart is empty</p>
                <span>Browse our catalog and choose rental plans to get started.</span>
                <button className="btn-browse" onClick={onClose}>
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item-card">
                    <div className="item-image-wrapper">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} />
                      ) : (
                        <div className="item-image-placeholder">📦</div>
                      )}
                    </div>

                    <div className="item-details">
                      <div className="item-title-row">
                        <h4>{item.productName}</h4>
                        <button
                          className="btn-remove-item"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="item-plan-info">
                        Rate: {formatCurrency(item.planPrice)} / {item.durationType}
                      </div>

                      <div className="item-duration-dates">
                        <span className="duration-label">Rental Duration:</span>
                        <span className="duration-dates-value">
                          {formatDate(item.startDate)} - {formatDate(item.endDate)} ({item.rentDurationCount} {item.durationType === "hourly" ? "hr" : "day"}{item.rentDurationCount > 1 ? "s" : ""})
                        </span>
                      </div>

                      <div className="item-deposit-info">
                        Security Deposit: {formatCurrency(item.deposit)}
                      </div>

                      <div className="item-action-row">
                        <div className="item-qty-selector">
                          <button
                            disabled={item.quantity <= 1}
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)}>
                            <Plus size={12} />
                          </button>
                        </div>

                        <div className="item-subtotal">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Checkout Form Step
            <div className="checkout-section">
              <h4>Delivery Details</h4>
              
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={isProcessing}
                />
              </div>

              <div className="form-group">
                <label>Shipping Address</label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  disabled={isProcessing}
                >
                  {profile?.addresses?.map((addr) => (
                    <option key={addr.address_id} value={addr.address_id}>
                      {addr.address_line1}, {addr.city} ({addr.pincode})
                    </option>
                  ))}
                  <option value="new">+ Enter New Address</option>
                </select>
              </div>

              {selectedAddressId === "new" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="form-group">
                    <label>Address Line 1</label>
                    <input
                      type="text"
                      value={addressForm.address_line1}
                      onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                      placeholder="Street address or P.O. Box"
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="form-group">
                    <label>Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={addressForm.address_line2}
                      onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="address-grid">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="City"
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="State"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Pin Code</label>
                    <input
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      placeholder="Pin Code"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="summary-breakdown">
              <div className="summary-row">
                <span>Rental Rates Subtotal:</span>
                <span>{formatCurrency(totals.rentalTotal)}</span>
              </div>
              <div className="summary-row">
                <span>Security Deposits:</span>
                <span>{formatCurrency(totals.depositTotal)}</span>
              </div>
              <div className="summary-row grand-total-row">
                <span>Grand Total:</span>
                <span className="grand-total-val">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>

            <div className="footer-actions">
              {step === "cart" ? (
                <>
                  <button className="btn-clear-cart" onClick={clearCart} disabled={isProcessing}>
                    Clear Cart
                  </button>
                  <button className="btn-checkout" onClick={handleProceedToCheckout} disabled={isProcessing}>
                    Proceed to Checkout
                  </button>
                </>
              ) : (
                <button className="btn-checkout" onClick={handlePayment} style={{ width: "100%", flex: "none" }} disabled={isProcessing}>
                  <CreditCard size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
                  {isProcessing ? "Processing Payment..." : `Pay ${formatCurrency(totals.grandTotal)}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
