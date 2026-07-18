export function toDateKey(value) {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}

export function toMonthInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getMonthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function getLongDateLabel(dateKey) {
  if (!dateKey) return "No date selected";
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getDateRangeLabel(startDateKey, endDateKey) {
  if (!startDateKey) return "No date range selected";
  if (!endDateKey || startDateKey === endDateKey) return getLongDateLabel(startDateKey);

  return `${getLongDateLabel(startDateKey)} - ${getLongDateLabel(endDateKey)}`;
}

export function buildMonthCalendar(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = firstDay.getDay();
  const days = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    days.push({
      day,
      dateKey: toDateKey(date),
      isToday: toDateKey(date) === toDateKey(new Date()),
    });
  }

  return days;
}

export function isDateInRange(dateKey, startDate, endDate) {
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);
  return Boolean(dateKey && startKey && endKey && startKey <= dateKey && dateKey <= endKey);
}

export function normalizeDateRange(startDateKey, endDateKey) {
  if (!endDateKey || startDateKey <= endDateKey) {
    return { startDateKey, endDateKey: endDateKey || startDateKey };
  }

  return { startDateKey: endDateKey, endDateKey: startDateKey };
}

export function doDateRangesOverlap(firstStartKey, firstEndKey, secondStartKey, secondEndKey) {
  return Boolean(
    firstStartKey &&
    firstEndKey &&
    secondStartKey &&
    secondEndKey &&
    firstStartKey <= secondEndKey &&
    secondStartKey <= firstEndKey,
  );
}
