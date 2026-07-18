import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../../dashboard/components/Navbar";
import { useSchedule } from "../hooks/useSchedule";
import { getDateRangeLabel, getMonthLabel } from "../utils/date.util";
import { SCHEDULE_STATUSES } from "../utils/scheduleStatus.util";
import { getDeliveryRoute, optimizeDeliveryRoute, updateStopStatus } from "../api/schedule.api";
import "../styles/Schedule.scss";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

const statusOrder = ["booked", "pickup", "late_pickup", "late_delivery"];

const Schedule = () => {
  const navigate = useNavigate();
  const {
    loading,
    error,
    searchQuery,
    setSearchQuery,
    todayKey,
    rangeStartDateKey,
    rangeEndDateKey,
    pendingRangeStartDateKey,
    selectDate,
    monthValue,
    setMonthValue,
    monthDate,
    calendarDays,
    itemsByDate,
    selectedItems,
    selectedDateSections,
    statusCounts,
  } = useSchedule();

  // Route Panel States
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const handleNewOrder = () => {
    const params = new URLSearchParams({
      from: "schedule",
      start_date: rangeStartDateKey,
      end_date: rangeEndDateKey,
    });

    navigate(`/dashboard/new-order?${params.toString()}`);
  };

  const fetchRouteForDate = async (date) => {
    try {
      setRouteLoading(true);
      setRouteError(null);
      const res = await getDeliveryRoute(date);
      setRouteData(res);
    } catch (err) {
      setRouteError(err.message || "Failed to load route");
      console.error(err);
    } finally {
      setRouteLoading(false);
    }
  };

  const handleOptimizeRoute = async () => {
    if (!rangeStartDateKey) return;
    try {
      setRouteLoading(true);
      setRouteError(null);
      const res = await optimizeDeliveryRoute(rangeStartDateKey);
      setRouteData(res);
      alert("Route successfully optimized!");
    } catch (err) {
      setRouteError(err.message || "Optimization failed");
      alert("Failed to optimize route: " + (err.message || err));
    } finally {
      setRouteLoading(false);
    }
  };

  const handleToggleRoutePanel = () => {
    if (!showRoutePanel) {
      fetchRouteForDate(rangeStartDateKey);
    }
    setShowRoutePanel(!showRoutePanel);
  };

  const handleUpdateStopStatus = async (stopId, status) => {
    try {
      await updateStopStatus(stopId, status);
      fetchRouteForDate(rangeStartDateKey);
    } catch (err) {
      alert("Failed to update status: " + (err.message || err));
    }
  };

  const isSingleDateSelected = rangeStartDateKey === rangeEndDateKey;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  // Dynamic Leaflet Loader
  useEffect(() => {
    if (apiKey || !showRoutePanel || !routeData || !routeData.store) return;

    const loadLeaflet = () => {
      if (window.L) {
        setLeafletLoaded(true);
        return;
      }

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => setLeafletLoaded(true);
        document.body.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.L) {
            clearInterval(interval);
            setLeafletLoaded(true);
          }
        }, 100);
      }
    };

    loadLeaflet();
  }, [showRoutePanel, routeData, apiKey]);

  // Leaflet Map Initializer
  useEffect(() => {
    if (apiKey || !leafletLoaded || !routeData || !routeData.store) return;

    const store = routeData.store;
    const stops = routeData.stops;

    const container = document.getElementById("leaflet-map");
    if (!container) return;

    if (container._leaflet_id) {
      const parent = container.parentElement;
      const newContainer = document.createElement("div");
      newContainer.id = "leaflet-map";
      newContainer.style.width = "100%";
      newContainer.style.height = "100%";
      newContainer.style.minHeight = "350px";
      newContainer.style.borderRadius = "12px";
      parent.replaceChild(newContainer, container);
    }

    const L = window.L;
    const map = L.map("leaflet-map").setView([store.lat, store.lng], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const storeIcon = L.divIcon({
      html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
      className: "custom-leaflet-marker",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    L.marker([store.lat, store.lng], { icon: storeIcon })
      .addTo(map)
      .bindPopup(`<strong>Depot:</strong> ${store.name || "Store Depot"}<br/>${store.fullAddress}`)
      .openPopup();

    const latlngs = [[store.lat, store.lng]];

    stops.forEach((stop) => {
      const stopColor = stop.stop_type === "delivery" ? "#c084fc" : "#38bdf8";
      const stopIcon = L.divIcon({
        html: `<div style="background-color: ${stopColor}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: black; box-shadow: 0 0 4px rgba(0,0,0,0.5);">${stop.stop_sequence}</div>`,
        className: "custom-leaflet-marker",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      if (stop.d_lat && stop.d_lng) {
        L.marker([stop.d_lat, stop.d_lng], { icon: stopIcon })
          .addTo(map)
          .bindPopup(`<strong>Stop ${stop.stop_sequence}: ${stop.first_name}</strong><br/>Type: ${stop.stop_type}<br/>Address: ${stop.d_address1}`);
        
        latlngs.push([stop.d_lat, stop.d_lng]);
      }
    });

    latlngs.push([store.lat, store.lng]);

    if (latlngs.length > 2) {
      L.polyline(latlngs, {
        color: "#c084fc",
        weight: 5,
        opacity: 0.8,
        dashArray: "5, 10"
      }).addTo(map);

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [leafletLoaded, routeData, apiKey]);

  return (
    <div className="schedule-page">
      <Navbar
        activeSection="schedule"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search schedule..."
      />

      <main className="schedule-content">
        <div className="schedule-toolbar">
          <div className="schedule-toolbar__left">
            <button className="schedule-new-btn" type="button" onClick={handleNewOrder}>New</button>
            <h1>Rental Scheduler</h1>
          </div>

          <label className="month-selector">
            <span>Month</span>
            <input
              type="month"
              value={monthValue}
              onChange={(event) => setMonthValue(event.target.value)}
            />
          </label>
        </div>

        {error && (
          <div className="schedule-error">
            Failed to load schedule. Please try again.
          </div>
        )}

        <section className="schedule-shell">
          <aside className="schedule-legend" aria-label="Schedule status legend">
            {statusOrder.map((statusKey) => (
              <div className="legend-row" key={statusKey}>
                <span>{SCHEDULE_STATUSES[statusKey].label}</span>
                <span className={`legend-dot ${SCHEDULE_STATUSES[statusKey].dotClass}`} />
                <strong>{statusCounts[statusKey] || 0}</strong>
              </div>
            ))}
          </aside>

          <section className="schedule-calendar-panel">
            <div className="calendar-header">
              <h2>{getMonthLabel(monthDate)}</h2>
            </div>

            <div className="calendar-grid">
              {weekdays.map((weekday, index) => (
                <div className="calendar-weekday" key={`${weekday}-${index}`}>
                  {weekday}
                </div>
              ))}

              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div className="calendar-day calendar-day--empty" key={`empty-${index}`} />;
                }

                const dayItems = itemsByDate[day.dateKey] || [];
                const isRangeStart = day.dateKey === rangeStartDateKey;
                const isRangeEnd = day.dateKey === rangeEndDateKey;
                const isInRange = rangeStartDateKey <= day.dateKey && day.dateKey <= rangeEndDateKey;
                const isPendingStart = day.dateKey === pendingRangeStartDateKey;
                const isToday = day.dateKey === todayKey;

                return (
                  <button
                    type="button"
                    className={[
                      "calendar-day",
                      isToday ? "calendar-day--today" : "",
                      isInRange ? "calendar-day--in-range" : "",
                      isRangeStart ? "calendar-day--range-start" : "",
                      isRangeEnd ? "calendar-day--range-end" : "",
                      isPendingStart ? "calendar-day--pending-start" : "",
                    ].filter(Boolean).join(" ")}
                    key={day.dateKey}
                    onClick={() => selectDate(day.dateKey)}
                  >
                    <span className="day-number">{day.day}</span>
                    <span className="day-dots">
                      {statusOrder.map((statusKey) => {
                        const count = dayItems.filter((item) => item.scheduleStatus === statusKey).length;
                        if (!count) return null;

                        return (
                          <span
                            className={`day-dot ${SCHEDULE_STATUSES[statusKey].dotClass}`}
                            key={statusKey}
                            title={`${SCHEDULE_STATUSES[statusKey].label}: ${count}`}
                          />
                        );
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="schedule-detail-panel">
            <div className="detail-header">
              <span>{getDateRangeLabel(rangeStartDateKey, rangeEndDateKey)}</span>
              <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {isSingleDateSelected && selectedItems.length > 0 && (
                  <button 
                    className="btn-map-route" 
                    type="button"
                    onClick={handleToggleRoutePanel}
                  >
                    Optimize Route
                  </button>
                )}
                <strong>{selectedItems.length} item{selectedItems.length === 1 ? "" : "s"}</strong>
              </div>
            </div>

            {loading ? (
              <div className="schedule-loading">Loading schedule...</div>
            ) : selectedDateSections.length === 0 ? (
              <div className="schedule-empty">No scheduled rentals for this date range.</div>
            ) : (
              <div className="schedule-sections">
                {selectedDateSections.map((section) => (
                  <section className="schedule-date-section" key={section.dateKey}>
                    <h3>{getDateRangeLabel(section.dateKey, section.dateKey)}</h3>
                    <ol className="schedule-list">
                      {section.items.map((item) => {
                        const statusMeta = SCHEDULE_STATUSES[item.scheduleStatus];

                        return (
                          <li className={`schedule-item ${statusMeta.itemClass}`} key={`${section.dateKey}-${item.id}`}>
                            <span className="schedule-item__ref">{item.orderRef}</span>
                            <span className="schedule-item__name">{item.productName}</span>
                            <span className="schedule-item__qty">{item.quantity} Unit</span>
                            <span className="schedule-item__status">({statusMeta.label})</span>
                            <button className="schedule-item__edit" type="button" title="Edit schedule item">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                ))}
              </div>
            )}

            <p className="schedule-note">
              Status markers show product availability across the selected month.
            </p>
          </section>
        </section>
      </main>

      {/* Slide-out Route Optimization Side Panel Overlay */}
      {showRoutePanel && (
        <div className="route-drawer-overlay">
          <div className="route-drawer">
            <div className="drawer-header">
              <div className="drawer-title-area">
                <h3>Delivery Route Optimizer</h3>
                <span className="date-badge">{getDateRangeLabel(rangeStartDateKey, rangeStartDateKey)}</span>
              </div>
              <div className="drawer-actions">
                <button 
                  type="button"
                  className="btn-reoptimize" 
                  onClick={handleOptimizeRoute} 
                  disabled={routeLoading}
                >
                  {routeLoading ? "Calculating..." : "Re-Optimize Stops"}
                </button>
                <button type="button" className="btn-close" onClick={() => setShowRoutePanel(false)}>×</button>
              </div>
            </div>

            {routeLoading && <div className="route-loading-state">Generating optimized path coordinates...</div>}
            {routeError && <div className="route-error-state">{routeError}</div>}

            {!routeLoading && !routeError && routeData && (
              <div className="route-drawer-content">
                {routeData.route && (
                  <div className="route-stats">
                    <div className="stat-card">
                      <span className="stat-label">Total Distance</span>
                      <strong className="stat-value">{Number(routeData.route.total_distance_km).toFixed(1)} km</strong>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Estimated Duration</span>
                      <strong className="stat-value">{routeData.route.total_duration_minutes} mins</strong>
                    </div>
                    {routeData.stops.length > 0 && (
                      <div className="stat-card">
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(routeData.store?.fullAddress)}&destination=${encodeURIComponent(routeData.store?.fullAddress)}&waypoints=${routeData.stops.map(s => encodeURIComponent(`${s.d_address1}, ${s.d_city}`)).join("|")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-open-gmaps"
                        >
                          Open in Google Maps App
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="route-split-layout">
                  {/* Left Column: Sorted Stop Itinerary Checklist */}
                  <div className="route-stops-checklist">
                    <h4>Itinerary Steps</h4>
                    {routeData.stops.length === 0 ? (
                      <p className="no-stops-msg">No pickups or deliveries scheduled for this day.</p>
                    ) : (
                      <div className="stops-timeline">
                        {/* Store Origin depot */}
                        <div className="stop-timeline-item store-point">
                          <div className="timeline-marker store-marker">Start</div>
                          <div className="stop-details">
                            <strong>{routeData.store?.name || "Store Depot"}</strong>
                            <p className="stop-address">{routeData.store?.fullAddress}</p>
                          </div>
                        </div>

                        {routeData.stops.map((stop) => {
                          const estTime = stop.estimated_arrival_time
                            ? new Date(stop.estimated_arrival_time).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "";
                          
                          const displayName = (stop.first_name || stop.last_name)
                            ? `${stop.first_name || ""} ${stop.last_name || ""}`.trim()
                            : (stop.email || "Registered Customer");

                          const displayAddress = stop.delivery_address_id
                            ? `${stop.d_address1 || ""}, ${stop.d_city || ""}`.trim().replace(/^,\s*|,\s*$/g, "")
                            : (routeData.store?.fullAddress || "Store Depot Address");

                          return (
                            <div key={stop.stop_id} className={`stop-timeline-item ${stop.status}`}>
                              <div className="timeline-marker stop-marker">{stop.stop_sequence}</div>
                              <div className="stop-details">
                                <div className="stop-header">
                                  <strong>{displayName}</strong>
                                  <span className={`stop-tag ${stop.stop_type}`}>{stop.stop_type}</span>
                                </div>
                                <p className="stop-address">{displayAddress || "Store Pickup Address"}</p>
                                <p className="stop-item-desc">Item: {stop.product_name || "Rented Asset"} ({stop.quantity} Qty)</p>
                                {estTime && (
                                  <p className="stop-arrival">
                                    Est. Arrival: <strong>{estTime}</strong>
                                  </p>
                                )}

                                <div className="stop-actions">
                                  {stop.status === "pending" && (
                                    <>
                                      <button 
                                        type="button"
                                        className="btn-stop-action completed" 
                                        onClick={() => handleUpdateStopStatus(stop.stop_id, "completed")}
                                      >
                                        Mark Done
                                      </button>
                                      <button 
                                        type="button"
                                        className="btn-stop-action failed" 
                                        onClick={() => handleUpdateStopStatus(stop.stop_id, "failed")}
                                      >
                                        Failed
                                      </button>
                                    </>
                                  )}
                                  {stop.status !== "pending" && (
                                    <span className={`status-pill ${stop.status}`}>{stop.status}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Store Return depot */}
                        <div className="stop-timeline-item store-point">
                          <div className="timeline-marker store-marker">End</div>
                          <div className="stop-details">
                            <strong>{routeData.store?.name || "Store Depot"}</strong>
                            <p className="stop-address">{routeData.store?.fullAddress}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Dynamic Interactive Map Panel */}
                  <div className="route-map-panel">
                    {routeData.stops.length > 0 && routeData.store ? (
                      apiKey ? (
                        <iframe
                          title="Route Navigation Map"
                          width="100%"
                          height="100%"
                          style={{ border: 0, borderRadius: "12px", minHeight: "350px" }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(
                            routeData.store.fullAddress
                          )}&destination=${encodeURIComponent(
                            routeData.store.fullAddress
                          )}&waypoints=${routeData.stops.map((s) => encodeURIComponent(`${s.d_address1}, ${s.d_city}`)).join("|")}`}
                        />
                      ) : (
                        <div id="leaflet-map" style={{ width: "100%", height: "100%", minHeight: "350px", borderRadius: "12px" }} />
                      )
                    ) : (
                      <div className="map-placeholder">
                        <p>No map path calculated yet. Check back once deliveries are scheduled.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
