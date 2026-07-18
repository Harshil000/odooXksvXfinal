/**
 * Calculates the total cost of a rental order based on dates and the selected rent plan.
 * Returns the total price and the duration count (e.g. 5 hours, 3 days).
 */
export function calculateRentalTotal(startDateStr, endDateStr, plan) {
  if (!startDateStr || !endDateStr || !plan || !plan.price) {
    return { total: 0, durationLabel: "" };
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return { total: 0, durationLabel: "" };
  }

  const diffMs = end - start;
  const price = Number(plan.price);
  
  let count;
  let label;

  switch (plan.duration_type) {
    case "hourly": {
      const hours = diffMs / (1000 * 60 * 60);
      count = Math.max(1, Math.ceil(hours));
      label = `${count} hour${count > 1 ? "s" : ""}`;
      break;
    }
    case "daily":
    case "nightly": {
      const days = diffMs / (1000 * 60 * 60 * 24);
      count = Math.max(1, Math.ceil(days));
      label = `${count} day${count > 1 ? "s" : ""}`;
      break;
    }
    case "weekly": {
      const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);
      count = Math.max(1, Math.ceil(weeks));
      label = `${count} week${count > 1 ? "s" : ""}`;
      break;
    }
    case "monthly": {
      const months = diffMs / (1000 * 60 * 60 * 24 * 30);
      count = Math.max(1, Math.ceil(months));
      label = `${count} month${count > 1 ? "s" : ""}`;
      break;
    }
    case "yearly": {
      const years = diffMs / (1000 * 60 * 60 * 24 * 365);
      count = Math.max(1, Math.ceil(years));
      label = `${count} year${count > 1 ? "s" : ""}`;
      break;
    }
    default: {
      count = 1;
      label = "1 period";
    }
  }

  const total = count * price;
  return { total, durationLabel: label };
}
