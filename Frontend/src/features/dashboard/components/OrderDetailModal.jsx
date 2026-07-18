import React from 'react';
import StatusBadge from './StatusBadge';

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const mins = parts[1] || "00";
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${hours}:${mins}${ampm}`;
}

function formatDateTime(dateStr, timeStr) {
  const date = formatDate(dateStr);
  const time = formatTime(timeStr);
  return time ? `${date}, ${time}` : date;
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  const handleOverlayClick = (e) => {
    if (e.target.className === 'order-modal-overlay') {
      onClose();
    }
  };

  const formattedTotal = formatCurrency(order.total);
  const formattedDeposit = formatCurrency(order.deposit);
  const formattedPenalty = formatCurrency(order.penalty);
  const formattedNetTotal = formatCurrency(order.total + order.penalty);

  return (
    <div className="order-modal-overlay" onClick={handleOverlayClick}>
      <div className="order-modal-content">
        {/* Header */}
        <div className="order-modal-header">
          <div className="header-title-wrapper">
            <h2>Order Details</h2>
            <span className="order-ref-badge">{order.orderRef}</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="order-modal-body">
          {/* Section 1: Customer Profile */}
          <div className="detail-section">
            <h3 className="section-title">Customer Information</h3>
            <div className="customer-detail-card">
              <div className="customer-avatar-large">
                {order.customer.slice(0, 2).toUpperCase()}
              </div>
              <div className="customer-info-text">
                <div className="customer-name-large">{order.customer}</div>
                <div className="customer-email-large">{order.customerEmail}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Order & Plan Information */}
          <div className="detail-section">
            <h3 className="section-title">Order Information</h3>
            <div className="info-grid">
              <div className="info-cell">
                <span className="info-label">Product Name</span>
                <span className="info-value">{order.productName || "General Goods"}</span>
              </div>
              <div className="info-cell">
                <span className="info-label">Plan Period</span>
                <span className="info-value plan-period-type">{order.durationType}</span>
              </div>
              <div className="info-cell">
                <span className="info-label">Delivery Status</span>
                <span className="info-value">
                  <StatusBadge status={order.status} />
                </span>
              </div>
              <div className="info-cell">
                <span className="info-label">Invoice Status</span>
                <span className="info-value">
                  <StatusBadge status={order.invoiceStatus} />
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Rental Timeline */}
          <div className="detail-section">
            <h3 className="section-title">Rental Period</h3>
            <div className="timeline-container">
              <div className="timeline-node start">
                <div className="node-icon">📅</div>
                <div className="node-details">
                  <span className="node-label">Pickup Date & Time</span>
                  <span className="node-value">{formatDateTime(order.pickupDate, order.pickupTime)}</span>
                </div>
              </div>
              <div className="timeline-connector"></div>
              <div className="timeline-node end">
                <div className="node-icon">🏁</div>
                <div className="node-details">
                  <span className="node-label">Expected Return Date & Time</span>
                  <span className="node-value">{formatDateTime(order.returnDate, order.returnTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Billing & Penalty */}
          <div className="detail-section">
            <h3 className="section-title">Payment Summary</h3>
            <div className="billing-summary-card">
              <div className="billing-row">
                <span>Base Rent Price</span>
                <strong>{formattedTotal}</strong>
              </div>
              <div className="billing-row">
                <span>Security Deposit</span>
                <strong>{formattedDeposit}</strong>
              </div>
              {order.penalty > 0 && (
                <div className="billing-row penalty-row">
                  <span className="warning-text">⚠️ Late Return Penalty</span>
                  <strong className="warning-value">{formattedPenalty}</strong>
                </div>
              )}
              <div className="billing-divider"></div>
              <div className="billing-row grand-total-row">
                <span>Total Amount Due</span>
                <strong>{formattedNetTotal}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="order-modal-footer">
          <button className="btn-modal-close" onClick={onClose}>
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
