import { useEffect, useMemo, useState } from "react";
import Navbar from "../../dashboard/components/Navbar";
import { loadMyOrderHistory } from "../services/orderHistory.service";
import "../styles/OrderHistory.scss";

const STATUS_LABELS = {
  reserved: "Reserved",
  pending: "Reserved",
  picked_up: "Picked Up",
  returned: "Returned",
  cancelled: "Cancelled",
};

const ACTIVE_STATUSES = ["reserved", "pending", "picked_up"];

function formatDate(date) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchHistory() {
      try {
        const rows = await loadMyOrderHistory();
        if (active) {
          setOrders(rows);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchHistory();

    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter((order) => (
      order.orderRef.toLowerCase().includes(query) ||
      order.productName?.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    ));
  }, [orders, searchQuery]);

  const activeOrders = filteredOrders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  const pastOrders = filteredOrders.filter((order) => !ACTIVE_STATUSES.includes(order.status));

  const renderOrderCard = (order) => (
    <article className="history-card" key={order.id}>
      <div className="history-card__top">
        <div>
          <span className="history-ref">{order.orderRef}</span>
          <h2>{order.productName || "Rental Product"}</h2>
        </div>
        <span className={`history-status history-status--${order.status}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="history-grid">
        <div>
          <span>Rental Start</span>
          <strong>{formatDate(order.startDate)}</strong>
        </div>
        <div>
          <span>Rental End</span>
          <strong>{formatDate(order.endDate)}</strong>
        </div>
        <div>
          <span>Asset</span>
          <strong>{order.assetId || "Not assigned"}</strong>
        </div>
        <div>
          <span>Invoice</span>
          <strong>{order.invoiceStatus.replaceAll("_", " ")}</strong>
        </div>
      </div>

      <div className="history-card__footer">
        <span>{formatCurrency(order.planPrice)} / {order.durationType || "period"}</span>
        <strong>{formatCurrency(order.total)}</strong>
      </div>
    </article>
  );

  return (
    <div className="order-history-page">
      <Navbar
        activeSection="history"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search history..."
      />

      <main className="order-history-content">
        <div className="history-header">
          <div>
            <h1>Order History</h1>
            <p>Track your rentals, statuses, assets, and payment totals.</p>
          </div>
          <div className="history-total">
            <strong>{orders.length}</strong>
            <span>Orders</span>
          </div>
        </div>

        {error && (
          <div className="history-state history-state--error">
            {error.message || "Unable to load order history."}
          </div>
        )}

        {loading ? (
          <div className="history-state">Loading order history...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="history-state">No orders found.</div>
        ) : (
          <div className="history-sections">
            <section className="history-section">
              <div className="history-section-title">
                <h2>Active Rentals</h2>
                <span>{activeOrders.length}</span>
              </div>
              <div className="history-list">
                {activeOrders.length ? activeOrders.map(renderOrderCard) : (
                  <div className="history-state">No active rentals right now.</div>
                )}
              </div>
            </section>

            <section className="history-section">
              <div className="history-section-title">
                <h2>Past Records</h2>
                <span>{pastOrders.length}</span>
              </div>
              <div className="history-list">
                {pastOrders.length ? pastOrders.map(renderOrderCard) : (
                  <div className="history-state">No past rental records yet.</div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistory;
