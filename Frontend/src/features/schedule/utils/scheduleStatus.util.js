export const SCHEDULE_STATUSES = {
  booked: {
    label: "Booked",
    dotClass: "dot--booked",
    itemClass: "schedule-item--booked",
  },
  pickup: {
    label: "Pick up",
    dotClass: "dot--pickup",
    itemClass: "schedule-item--pickup",
  },
  late_pickup: {
    label: "Late Pick up",
    dotClass: "dot--late-pickup",
    itemClass: "schedule-item--late-pickup",
  },
  late_delivery: {
    label: "Late Delivery",
    dotClass: "dot--late-delivery",
    itemClass: "schedule-item--late-delivery",
  },
};

export function getScheduleStatus(order, todayKey) {
  const startKey = order.startDateKey;
  const endKey = order.endDateKey;
  const status = order.deliveryStatus;

  if (status === "reserved" && startKey < todayKey) {
    return "late_pickup";
  }

  if (!["returned", "cancelled"].includes(status) && endKey < todayKey) {
    return "late_delivery";
  }

  if (status === "reserved" && startKey >= todayKey) {
    return "pickup";
  }

  return "booked";
}
