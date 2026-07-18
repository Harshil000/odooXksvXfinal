import { useState } from "react";
import Navbar from "../../dashboard/components/Navbar";
import { useReports } from "../hooks/useReports";
import { exportReportCsv, exportReportExcel } from "../services/reports.service";
import { formatCurrency, getMonthLabel } from "../utils/report.util";
import "../styles/Reports.scss";

const Reports = () => {
  const { monthValue, setMonthValue, rows, totals, loading, error } = useReports();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chartType, setChartType] = useState("bar"); // "bar", "pie", "line"

  const maxOrders = Math.max(...rows.map((row) => row.orderCount), 1);
  const totalOrders = rows.reduce((sum, r) => sum + r.orderCount, 0);

  const COLORS = ["#a78bfa", "#38bdf8", "#34d399", "#fb923c", "#f472b6", "#facc15", "#f87171"];

  // Calculate ticks for Y axis
  const getTicks = () => {
    if (maxOrders <= 5) {
      return Array.from({ length: maxOrders + 1 }, (_, i) => maxOrders - i);
    }
    return [
      maxOrders,
      Math.round(maxOrders * 0.75),
      Math.round(maxOrders * 0.50),
      Math.round(maxOrders * 0.25),
      0
    ];
  };

  // Pie chart slice definitions (donut)
  let accumulatedCircumference = 0;
  const slices = rows.map((row, index) => {
    const percentage = totalOrders > 0 ? (row.orderCount / totalOrders) : 0;
    const strokeLength = percentage * 502.65;
    const strokeOffset = 502.65 - strokeLength + accumulatedCircumference;
    accumulatedCircumference -= strokeLength;
    return {
      ...row,
      strokeLength,
      strokeOffset,
      color: COLORS[index % COLORS.length],
      percentage: Math.round(percentage * 100),
    };
  });

  // Line chart coordinates
  const GW = 500;
  const GH = 180;
  const getX = (index) => {
    if (rows.length <= 1) return 60 + GW / 2;
    return 60 + (index * (GW / (rows.length - 1)));
  };
  const getY = (orderCount) => {
    const ratio = maxOrders > 0 ? (orderCount / maxOrders) : 0;
    return 210 - (ratio * GH);
  };
  const points = rows.map((row, index) => ({
    x: getX(index),
    y: getY(row.orderCount),
    ...row
  }));
  const pathD = points.length > 0 
    ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
    : '';
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} 210 L ${points[0].x} 210 Z`
    : '';

  const handlePrint = () => {
    setSettingsOpen(false);
    window.print();
  };

  return (
    <div className="reports-page">
      <Navbar activeSection="reports" searchQuery="" onSearchChange={() => {}} searchPlaceholder="Search reports..." />

      <main className="reports-content">
        <div className="reports-toolbar">
          <div className="reports-title-row">
            <h1>Reports</h1>
            <div className="report-settings">
              <button
                type="button"
                className="report-settings-btn"
                onClick={() => setSettingsOpen((value) => !value)}
                title="Report settings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.31.22.65.22 1H21a2 2 0 1 1 0 4h-1.09c0 .35-.08.69-.22 1Z" />
                </svg>
              </button>
              {settingsOpen && (
                <div className="report-settings-menu">
                  <button type="button" onClick={handlePrint}>Print PDF</button>
                  <button type="button" onClick={() => exportReportExcel(rows, totals, monthValue)}>Export Excel</button>
                  <button type="button" onClick={() => exportReportCsv(rows, totals, monthValue)}>Export CSV</button>
                </div>
              )}
            </div>
          </div>

          <label className="report-month-picker">
            <span>Sales Month</span>
            <input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} />
          </label>

          <div className="report-view-tabs">
            <button 
              type="button" 
              className={chartType === "bar" ? "active" : ""} 
              onClick={() => setChartType("bar")}
            >
              Bar
            </button>
            <button 
              type="button" 
              className={chartType === "pie" ? "active" : ""} 
              onClick={() => setChartType("pie")}
            >
              Pie
            </button>
            <button 
              type="button" 
              className={chartType === "line" ? "active" : ""} 
              onClick={() => setChartType("line")}
            >
              Line
            </button>
          </div>
        </div>

        <section className="report-print-area">
          <div className="report-summary">
            <h2>Product Sales - {getMonthLabel(monthValue)}</h2>
            <div className="report-summary-cards">
              <div><span>Products</span><strong>{rows.length}</strong></div>
              <div><span>Orders</span><strong>{totals.orderCount}</strong></div>
              <div><span>Quantity</span><strong>{totals.quantity}</strong></div>
              <div><span>Sales</span><strong>{formatCurrency(totals.sales)}</strong></div>
            </div>
          </div>

          {error && <div className="reports-error">{error.message || "Unable to load reports."}</div>}
          {loading ? (
            <div className="reports-loading">Loading monthly sales...</div>
          ) : rows.length === 0 ? (
            <div className="reports-empty">No product sales found for this month.</div>
          ) : (
            <>
              <div className="report-chart-container">
                {chartType === "bar" && (
                  <div className="report-chart">
                    <div className="chart-y-axis">
                      {getTicks().map((tick, index) => (
                        <span key={index}>{tick}</span>
                      ))}
                    </div>
                    <div className="chart-bars">
                      {rows.map((row) => (
                        <div className="chart-bar-item" key={row.productId}>
                          <div className="chart-bar-track">
                            <span style={{ height: `${Math.max(8, (row.orderCount / maxOrders) * 100)}%` }} title={`${row.productName}: ${row.orderCount} Orders`} />
                          </div>
                          <strong>{row.productName}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {chartType === "pie" && (
                  <div className="report-pie-container">
                    <div className="pie-chart-wrapper">
                      <svg width="200" height="200" viewBox="0 0 200 200" className="donut-chart-svg">
                        <circle cx="100" cy="100" r="80" fill="transparent" stroke="#15151c" strokeWidth="20" />
                        {slices.map((slice) => (
                          <circle
                            key={slice.productId}
                            cx="100"
                            cy="100"
                            r="80"
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth="20"
                            strokeDasharray="502.65"
                            strokeDashoffset={slice.strokeOffset}
                            transform="rotate(-90 100 100)"
                            strokeLinecap={slice.strokeLength > 5 ? "round" : "butt"}
                            className="donut-slice"
                          >
                            <title>{slice.productName}: {slice.orderCount} Orders ({slice.percentage}%)</title>
                          </circle>
                        ))}
                        <text x="100" y="95" textAnchor="middle" fill="#f8fafc" fontSize="18" fontWeight="700">
                          {totals.orderCount}
                        </text>
                        <text x="100" y="115" textAnchor="middle" fill="#71717a" fontSize="9" fontWeight="600" letterSpacing="0.5">
                          TOTAL ORDERS
                        </text>
                      </svg>
                    </div>
                    <div className="pie-chart-legend">
                      {slices.map((slice) => (
                        <div key={slice.productId} className="legend-item">
                          <span className="legend-color-dot" style={{ backgroundColor: slice.color }}></span>
                          <span className="legend-name">{slice.productName}</span>
                          <span className="legend-value">{slice.orderCount} ({slice.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {chartType === "line" && (
                  <div className="report-line-container">
                    <div className="line-chart-y-axis-labels">
                      {getTicks().map((tick, index) => {
                        const y = 30 + (index * (GH / (getTicks().length - 1)));
                        return (
                          <span key={index} style={{ position: "absolute", top: `${y}px`, right: "10px", transform: "translateY(-50%)" }}>
                            {tick}
                          </span>
                        );
                      })}
                    </div>
                    <div className="line-chart-svg-wrapper">
                      <svg width="100%" height="250" viewBox="0 0 600 250" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="line-area-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Grid Lines */}
                        {getTicks().map((_, index) => {
                          const y = 30 + index * (GH / (getTicks().length - 1));
                          return (
                            <line key={index} x1="60" y1={y} x2="560" y2={y} stroke="#303038" strokeWidth="1" strokeDasharray="4 4" />
                          );
                        })}

                        {/* Area under the line */}
                        {points.length > 0 && (
                          <path d={areaD} fill="url(#line-area-gradient)" />
                        )}

                        {/* Line path */}
                        {points.length > 0 && (
                          <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        )}

                        {/* Data Nodes */}
                        {points.map((p) => (
                          <circle key={p.productId} cx={p.x} cy={p.y} r="5" fill="#111116" stroke="#38bdf8" strokeWidth="2.5">
                            <title>{p.productName}: {p.orderCount} Orders</title>
                          </circle>
                        ))}
                      </svg>
                      {/* Product labels below x-axis */}
                      <div className="line-chart-x-axis-labels">
                        {points.map((p) => (
                          <span key={p.productId} style={{ left: `${(p.x / 600) * 100}%` }}>
                            {p.productName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <table className="report-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Orders</th>
                    <th>Quantity</th>
                    <th>Sales</th>
                    <th>Deposit</th>
                    <th>Late Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.productId}>
                      <td>{row.productName}</td>
                      <td>{row.orderCount}</td>
                      <td>{row.quantity}</td>
                      <td>{formatCurrency(row.sales)}</td>
                      <td>{formatCurrency(row.deposits)}</td>
                      <td>{formatCurrency(row.penalties)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default Reports;
