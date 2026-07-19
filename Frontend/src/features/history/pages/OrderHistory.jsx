import { useState, useEffect } from "react";
import Navbar from "../../dashboard/components/Navbar";
import httpClient from "../../../shared/api/httpClient";
import StatusBadge from "../../dashboard/components/StatusBadge";
import "../styles/OrderHistory.scss";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const FALLBACK_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchMyOrders() {
      try {
        const response = await httpClient.get("/orders/my-orders");
        if (active) {
          setOrders(response.data.orders || []);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load order history");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMyOrders();

    return () => {
      active = false;
    };
  }, []);

  // Split into active rentals and past history
  // Active: reserved, pending, picked_up
  // Past: returned, cancelled
  const activeRentals = orders.filter((o) =>
    ["reserved", "pending", "picked_up"].includes(o.delivery_status)
  );
  
  const pastHistory = orders.filter((o) =>
    ["returned", "cancelled"].includes(o.delivery_status)
  );

  return (
    <div className="order-history-page">
      <Navbar activeSection="history" searchQuery="" onSearchChange={() => {}} searchPlaceholder="Search order history..." />

      <main className="order-history-content">
        <h1>Rental & Purchase History</h1>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            Loading your order records...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#ef4444" }}>
            {error}
          </div>
        ) : (
          <>
            {/* Active Rentals Section */}
            <section className="history-section">
              <h2>Current Active Rentals</h2>
              {activeRentals.length === 0 ? (
                <div className="empty-state">No current active rentals.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Rental Period</th>
                        <th>Security Deposit</th>
                        <th>Rental Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRentals.map((o) => {
                        const refNum = String(o.rent_id).padStart(5, "0");
                        return (
                          <tr
                            key={o.rent_id}
                            className="clickable-row"
                            onClick={() => setSelectedOrder(o)}
                          >
                            <td style={{ fontWeight: "600", color: "var(--accent)" }}>
                              SO{refNum}
                            </td>
                            <td>
                              <div className="product-cell">
                                <img
                                  className="product-img"
                                  src={o.image || FALLBACK_IMAGE}
                                  alt={o.product_name}
                                />
                                <span className="product-name">{o.product_name}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                                {formatDate(o.start_date)} - {formatDate(o.end_date)}
                              </span>
                            </td>
                            <td style={{ fontWeight: "500" }}>{formatCurrency(o.deposit)}</td>
                            <td style={{ fontWeight: "bold" }}>{formatCurrency(o.total)}</td>
                            <td>
                              <StatusBadge status={o.delivery_status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Past History Section */}
            <section className="history-section">
              <h2>Past Completed Orders</h2>
              {pastHistory.length === 0 ? (
                <div className="empty-state">No past rental history.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Rental Period</th>
                        <th>Security Deposit</th>
                        <th>Rental Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastHistory.map((o) => {
                        const refNum = String(o.rent_id).padStart(5, "0");
                        return (
                          <tr
                            key={o.rent_id}
                            className="clickable-row"
                            onClick={() => setSelectedOrder(o)}
                          >
                            <td style={{ fontWeight: "600", color: "var(--accent)" }}>
                              SO{refNum}
                            </td>
                            <td>
                              <div className="product-cell">
                                <img
                                  className="product-img"
                                  src={o.image || FALLBACK_IMAGE}
                                  alt={o.product_name}
                                />
                                <span className="product-name">{o.product_name}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                                {formatDate(o.start_date)} - {formatDate(o.end_date)}
                              </span>
                            </td>
                            <td style={{ fontWeight: "500" }}>{formatCurrency(o.deposit)}</td>
                            <td style={{ fontWeight: "bold" }}>{formatCurrency(o.total)}</td>
                            <td>
                              <StatusBadge status={o.delivery_status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Details View Modal */}
      {selectedOrder && (
        <div className="order-detail-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-detail-card" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h3>Order details — SO{String(selectedOrder.rent_id).padStart(5, "0")}</h3>
              <button className="btn-close" onClick={() => setSelectedOrder(null)}>&times;</button>
            </div>
            <div className="detail-body">
              <div className="detail-product-hero">
                <img
                  className="hero-img"
                  src={selectedOrder.image || FALLBACK_IMAGE}
                  alt={selectedOrder.product_name}
                />
                <div className="hero-info">
                  <h4>{selectedOrder.product_name}</h4>
                  <span className="hero-price">
                    {formatCurrency(selectedOrder.plan_price)} / per {selectedOrder.duration_type || "month"}
                  </span>
                </div>
              </div>

              <div className="detail-grid">
                <div className="grid-item">
                  <label>Order Date</label>
                  <span>{formatDate(selectedOrder.created_at)}</span>
                </div>
                <div className="grid-item">
                  <label>Delivery Status</label>
                  <StatusBadge status={selectedOrder.delivery_status} />
                </div>
                <div className="grid-item">
                  <label>Rental Start Date</label>
                  <span>{formatDate(selectedOrder.start_date)}</span>
                </div>
                <div className="grid-item">
                  <label>Rental End Date</label>
                  <span>{formatDate(selectedOrder.end_date)}</span>
                </div>
                <div className="grid-item">
                  <label>Security Deposit Paid</label>
                  <span style={{ color: "var(--accent)", fontWeight: "600" }}>
                    {formatCurrency(selectedOrder.deposit)}
                  </span>
                </div>
                <div className="grid-item">
                  <label>Rental Fee Amount</label>
                  <span style={{ fontWeight: "600" }}>{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="grid-item" style={{ gridColumn: "span 2" }}>
                  <label>Invoice Status</label>
                  <span style={{ textTransform: "capitalize" }}>
                    {selectedOrder.invoice_status?.replace(/_/g, " ") || "nothing_to_invoice"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
