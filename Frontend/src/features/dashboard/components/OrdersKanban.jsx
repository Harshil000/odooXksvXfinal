import { useState } from "react";
import { updateOrderStatus } from "../api/dashboard.api";
import StatusBadge from "./StatusBadge";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const COLUMNS = [
  { id: "reserved", label: "Reserved", statuses: ["reserved", "pending", "quotation", "draft"] },
  { id: "picked_up", label: "Picked Up", statuses: ["picked_up"] },
  { id: "returned", label: "Returned", statuses: ["returned"] },
  { id: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

const START_STATUSES = ["reserved", "pending", "quotation", "draft"];
const STATUS_LABELS = {
  reserved: "Reserved",
  picked_up: "Picked Up",
  returned: "Returned",
  cancelled: "Cancelled",
};

function getAllowedNextStatuses(status) {
  if (START_STATUSES.includes(status)) return ["picked_up", "cancelled"];
  if (status === "picked_up") return ["returned"];
  return [];
}

function canMoveOrderStatus(fromStatus, toStatus) {
  return fromStatus === toStatus || getAllowedNextStatuses(fromStatus).includes(toStatus);
}

const OrdersKanban = ({ orders = [], onStatusUpdate, onCardClick }) => {
  const [updatingId, setUpdatingId] = useState(null);
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find((item) => item.id === orderId);
    if (order && !canMoveOrderStatus(order.status, newStatus)) {
      alert(`Invalid move. ${STATUS_LABELS[order.status] || order.status} can only move to ${getAllowedNextStatuses(order.status).map((status) => STATUS_LABELS[status]).join(" or ") || "no further status"}.`);
      return;
    }

    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, newStatus);
      if (onStatusUpdate) {
        await onStatusUpdate();
      }
    } catch (err) {
      alert("Failed to update status: " + (err.message || err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDragStart = (event, order) => {
    if (updatingId === order.id) {
      event.preventDefault();
      return;
    }

    setDraggedOrder(order);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(order.id));
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (event, columnId) => {
    if (draggedOrder && !canMoveOrderStatus(draggedOrder.status, columnId)) {
      event.dataTransfer.dropEffect = "none";
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDrop = async (event, newStatus) => {
    event.preventDefault();
    setDragOverColumn(null);

    if (!draggedOrder || draggedOrder.status === newStatus) {
      setDraggedOrder(null);
      return;
    }

    if (!canMoveOrderStatus(draggedOrder.status, newStatus)) {
      alert(`Invalid move. ${STATUS_LABELS[draggedOrder.status] || draggedOrder.status} can only move to ${getAllowedNextStatuses(draggedOrder.status).map((status) => STATUS_LABELS[status]).join(" or ") || "no further status"}.`);
      setDraggedOrder(null);
      return;
    }

    await handleStatusChange(draggedOrder.id, newStatus);
    setDraggedOrder(null);
  };

  // Group orders by columns
  const columnsData = COLUMNS.map((col) => {
    const colOrders = orders.filter((o) => col.statuses.includes(o.status));
    return { ...col, orders: colOrders };
  });

  return (
    <div className="orders-kanban-board">
      {columnsData.map((col) => (
        <div
          key={col.id}
          className={`kanban-column ${dragOverColumn === col.id ? "is-drag-over" : ""}`}
          id={`kanban-column-${col.id}`}
          onDragOver={(event) => handleDragOver(event, col.id)}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={(event) => handleDrop(event, col.id)}
        >
          <div className="kanban-column-header">
            <h3>{col.label}</h3>
            <span className="column-count-badge">{col.orders.length}</span>
          </div>

          <div className="kanban-cards-container">
            {col.orders.length === 0 ? (
              <div className="kanban-empty-placeholder">No orders</div>
            ) : (
              col.orders.map((order) => (
                <div
                  key={order.id}
                  className={`kanban-card ${updatingId === order.id ? "card-updating" : ""} ${
                    draggedOrder?.id === order.id ? "is-dragging" : ""
                  }`}
                  draggable={updatingId !== order.id}
                  onDragStart={(event) => handleDragStart(event, order)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onCardClick && onCardClick(order)}
                >
                  <div className="card-header">
                    <span className="order-ref">{order.orderRef}</span>
                    <span className="order-price">{formatCurrency(order.total)}</span>
                  </div>

                  <div className="card-body">
                    <div className="customer-info">
                      <span className="customer-avatar">
                        {order.customer.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <div className="customer-name">{order.customer}</div>
                        <div className="customer-email">{order.customerEmail}</div>
                      </div>
                    </div>

                    <div className="product-details">
                      <span className="product-label">Product:</span>
                      <span className="product-value">{order.productName || "General Goods"}</span>
                    </div>

                    <div className="dates-range">
                      <div>
                        <span className="date-label">From:</span>{" "}
                        <span className="date-value">{formatDate(order.pickupDate)}</span>
                      </div>
                      <div>
                        <span className="date-label">To:</span>{" "}
                        <span className="date-value">{formatDate(order.returnDate)}</span>
                      </div>
                    </div>

                    {order.penalty > 0 && (
                      <div 
                        className="late-penalty-warning"
                        style={{
                          marginTop: "8px",
                          padding: "4px 8px",
                          backgroundColor: "#fef2f2",
                          border: "1px solid #fee2e2",
                          borderRadius: "4px",
                          color: "#ef4444",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <span role="img" aria-label="warning">⚠️</span>
                        Late Penalty: {formatCurrency(order.penalty)}
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    <StatusBadge status={order.invoiceStatus} />

                    <div className="status-selector-wrapper" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="status-selector-dropdown"
                      >
                        <option value={order.status}>{STATUS_LABELS[order.status] || order.status}</option>
                        {getAllowedNextStatuses(order.status).map((status) => (
                          <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrdersKanban;
