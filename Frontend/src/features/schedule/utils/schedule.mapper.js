import { toDateKey } from "./date.util";
import { getScheduleStatus } from "./scheduleStatus.util";

export function mapOrderToScheduleItem(order, todayKey) {
  const refNum = String(order.rent_id).padStart(4, "0");
  const startDateKey = toDateKey(order.start_date);
  const endDateKey = toDateKey(order.end_date);
  const deliveryStatus = order.delivery_status || "reserved";

  const mapped = {
    id: order.rent_id,
    orderRef: `SO${refNum}`,
    productName: order.product_name || "Product",
    customerEmail: order.customer_email || order.email || "",
    quantity: 1,
    startDate: order.start_date,
    endDate: order.end_date,
    startDateKey,
    endDateKey,
    deliveryStatus,
    assetId: order.asset_id,
  };

  return {
    ...mapped,
    scheduleStatus: getScheduleStatus(mapped, todayKey),
  };
}
