import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "../hooks/useCart";
import "../styles/CartDrawer.scss";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

const CartDrawer = ({ isOpen, onClose }) => {
  const { cartItems, totals, updateQty, removeItem, clearCart } = useCart();

  if (!isOpen) return null;

  const handleCheckout = () => {
    alert("Checkout Successful! Your rental booking has been processed.");
    clearCart();
    onClose();
  };

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="title-section">
            <ShoppingBag size={20} className="accent-icon" />
            <h3>Your Rental Cart</h3>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="cart-drawer-content">
          {cartItems.length === 0 ? (
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
                      {/* Quantity Selector */}
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

                      {/* Subtotal */}
                      <div className="item-subtotal">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
              <button className="btn-clear-cart" onClick={clearCart}>
                Clear Cart
              </button>
              <button className="btn-checkout" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
