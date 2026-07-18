import { useState } from "react";
import { useNavigate } from "react-router";
import { useDashboardOrders } from "../hooks/useDashboardOrders";
import Navbar from "../components/Navbar";
import OrdersTable from "../components/OrdersTable";
import OrdersKanban from "../components/OrdersKanban";
import "../styles/Dashboard.scss";

function formatCurrency(amount) {
  return `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("dashboard_view_mode") || "list");

  const {
    orders,
    stats,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    dateFilterEnabled,
    setDateFilterEnabled,
    refresh,
  } = useDashboardOrders();

  const handleViewChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("dashboard_view_mode", mode);
  };

  const filterPills = [
    { key: "today", label: "Today", count: stats.todayCount, color: "pill--today" },
    { key: "pickup", label: "Pickup", count: stats.pickupCount, color: "pill--pickup" },
    { key: "return", label: "Return", count: stats.returnCount, color: "pill--return" },
    { key: "late", label: "Late", count: stats.lateCount, color: "pill--late" },
  ];

  const handleFilterClick = (key) => {
    setActiveFilter((prev) => (prev === key ? null : key));
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar activeSection="orders" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page" id="dashboard-page">
      <Navbar activeSection="orders" searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="dashboard-content">
        {/* Action Bar */}
        <div className="action-bar">
          <div className="action-bar-left">
            <h1 className="page-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Rental Order
            </h1>
            <button
              className="btn-new"
              id="btn-new-order"
              onClick={() => navigate("/dashboard/new-order")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New
            </button>
          </div>

          <div className="action-bar-right">
            <div className="view-switcher">
              <button
                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                title="List View"
                id="view-list-btn"
                onClick={() => handleViewChange("list")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
              <button
                className={`view-btn ${viewMode === "kanban" ? "active" : ""}`}
                title="Kanban View"
                id="view-kanban-btn"
                onClick={() => handleViewChange("kanban")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="filter-section">
          <div className="filter-pills">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                className={`filter-pill ${pill.color} ${activeFilter === pill.key ? "active" : ""}`}
                onClick={() => handleFilterClick(pill.key)}
                id={`filter-${pill.key}`}
              >
                <span className="pill-count">{pill.count}</span>
                <span className="pill-label">{pill.label}</span>
              </button>
            ))}
          </div>

          <div className="filter-summary">
            <label className="date-filter-toggle">
              <input
                type="checkbox"
                checked={dateFilterEnabled}
                onChange={(e) => setDateFilterEnabled(e.target.checked)}
                id="date-filter-toggle"
              />
              <span>Last 7 Days</span>
            </label>

            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Sales</span>
                <span className="stat-value stat-value--sales">
                  {formatCurrency(stats.totalSales)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Late Fees</span>
                <span className="stat-value stat-value--fees">
                  {formatCurrency(stats.totalLateFees)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Deposit</span>
                <span className="stat-value stat-value--deposit">
                  {formatCurrency(stats.totalDeposit)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="dashboard-error">
            <p>Failed to load orders. Please try again.</p>
          </div>
        )}

        {/* Orders Table or Kanban view */}
        {viewMode === "list" ? (
          <OrdersTable orders={orders} />
        ) : (
          <OrdersKanban orders={orders} onStatusUpdate={refresh} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
