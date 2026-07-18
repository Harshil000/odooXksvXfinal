import { useNavigate } from "react-router";
import Navbar from "../../dashboard/components/Navbar";
import { useSchedule } from "../hooks/useSchedule";
import { getDateRangeLabel, getMonthLabel } from "../utils/date.util";
import { SCHEDULE_STATUSES } from "../utils/scheduleStatus.util";
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

  const handleNewOrder = () => {
    const params = new URLSearchParams({
      from: "schedule",
      start_date: rangeStartDateKey,
      end_date: rangeEndDateKey,
    });

    navigate(`/dashboard/new-order?${params.toString()}`);
  };

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
              <strong>{selectedItems.length} item{selectedItems.length === 1 ? "" : "s"}</strong>
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
    </div>
  );
};

export default Schedule;
