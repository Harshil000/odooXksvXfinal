import { useEffect, useMemo, useState } from "react";
import { loadScheduleItems } from "../services/schedule.service";
import {
  buildMonthCalendar,
  doDateRangesOverlap,
  isDateInRange,
  normalizeDateRange,
  toDateKey,
  toMonthInputValue,
} from "../utils/date.util";

export function useSchedule() {
  const today = new Date();
  const todayKey = toDateKey(today);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeStartDateKey, setRangeStartDateKey] = useState(todayKey);
  const [rangeEndDateKey, setRangeEndDateKey] = useState(todayKey);
  const [monthValue, setMonthValue] = useState(toMonthInputValue(today));

  useEffect(() => {
    let active = true;

    async function fetchSchedule() {
      try {
        const rows = await loadScheduleItems();
        if (active) {
          setItems(rows);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err);
          console.error("Error fetching schedule:", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchSchedule();
    return () => {
      active = false;
    };
  }, []);

  const monthDate = useMemo(() => {
    const [year, month] = monthValue.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }, [monthValue]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => (
      item.orderRef.toLowerCase().includes(query) ||
      item.productName.toLowerCase().includes(query) ||
      item.customerEmail.toLowerCase().includes(query)
    ));
  }, [items, searchQuery]);

  const calendarDays = useMemo(() => buildMonthCalendar(monthDate), [monthDate]);

  const itemsByDate = useMemo(() => {
    const grouped = {};

    for (const day of calendarDays) {
      if (!day) continue;
      grouped[day.dateKey] = filteredItems.filter((item) => (
        isDateInRange(day.dateKey, item.startDate, item.endDate)
      ));
    }

    return grouped;
  }, [calendarDays, filteredItems]);

  const selectedRange = useMemo(() => (
    normalizeDateRange(rangeStartDateKey, rangeEndDateKey)
  ), [rangeStartDateKey, rangeEndDateKey]);

  const selectedItems = useMemo(() => (
    filteredItems.filter((item) => doDateRangesOverlap(
      selectedRange.startDateKey,
      selectedRange.endDateKey,
      item.startDateKey,
      item.endDateKey,
    ))
  ), [filteredItems, selectedRange]);

  const selectedDateSections = useMemo(() => (
    calendarDays
      .filter((day) => day && selectedRange.startDateKey <= day.dateKey && day.dateKey <= selectedRange.endDateKey)
      .map((day) => ({
        dateKey: day.dateKey,
        items: itemsByDate[day.dateKey] || [],
      }))
      .filter((section) => section.items.length > 0)
  ), [calendarDays, itemsByDate, selectedRange]);

  const statusCounts = useMemo(() => {
    return filteredItems.reduce((counts, item) => {
      counts[item.scheduleStatus] = (counts[item.scheduleStatus] || 0) + 1;
      return counts;
    }, {});
  }, [filteredItems]);

  const handleMonthChange = (value) => {
    setMonthValue(value);
    setRangeStartDateKey(`${value}-01`);
    setRangeEndDateKey(`${value}-01`);
  };

  const selectDate = (dateKey) => {
    if (!rangeStartDateKey || rangeEndDateKey) {
      setRangeStartDateKey(dateKey);
      setRangeEndDateKey("");
      return;
    }

    const nextRange = normalizeDateRange(rangeStartDateKey, dateKey);
    setRangeStartDateKey(nextRange.startDateKey);
    setRangeEndDateKey(nextRange.endDateKey);
  };

  return {
    loading,
    error,
    searchQuery,
    setSearchQuery,
    todayKey,
    rangeStartDateKey: selectedRange.startDateKey,
    rangeEndDateKey: selectedRange.endDateKey,
    pendingRangeStartDateKey: rangeEndDateKey ? "" : rangeStartDateKey,
    selectDate,
    monthValue,
    setMonthValue: handleMonthChange,
    monthDate,
    calendarDays,
    itemsByDate,
    selectedItems,
    selectedDateSections,
    statusCounts,
  };
}
