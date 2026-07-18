import { useState } from "react";
import StatusBadge from "./StatusBadge";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  // timeStr could be "HH:MM:SS" or "HH:MM"
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const OrdersTable = ({ orders = [], onRowClick }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const allSelected =
    orders.length > 0 && selectedIds.size === orders.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (orders.length === 0) {
    return (
      <div className="orders-table-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <p>No rental orders found</p>
        <span>Create a new order to get started</span>
      </div>
    );
  }

  return (
    <div className="orders-table-wrapper">
      <table className="orders-table" id="orders-table">
        <thead>
          <tr>
            <th className="col-checkbox">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                id="select-all-orders"
              />
            </th>
            <th>Order Reference</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Pickup Date</th>
            <th>Return Date</th>
            <th className="col-number">Penalty</th>
            <th className="col-number">Total</th>
            <th>Invoice Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className={selectedIds.has(order.id) ? "row-selected" : ""}
              onClick={() => onRowClick && onRowClick(order)}
              style={{ cursor: "pointer" }}
            >
              <td className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onChange={() => toggleOne(order.id)}
                />
              </td>
              <td className="col-ref">{order.orderRef}</td>
              <td className="col-customer">
                <span className="customer-name">{order.customer}</span>
              </td>
              <td>
                <StatusBadge status={order.status} />
              </td>
              <td className="col-date">
                {formatDateTime(order.pickupDate, order.pickupTime)}
              </td>
              <td className="col-date">
                {formatDateTime(order.returnDate, order.returnTime)}
              </td>
              <td 
                className="col-number" 
                style={{ 
                  color: order.penalty > 0 ? "#ef4444" : "inherit", 
                  fontWeight: order.penalty > 0 ? "600" : "normal" 
                }}
              >
                {order.penalty > 0 ? formatCurrency(order.penalty) : "—"}
              </td>
              <td className="col-number">{formatCurrency(order.total)}</td>
              <td>
                <StatusBadge status={order.invoiceStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
