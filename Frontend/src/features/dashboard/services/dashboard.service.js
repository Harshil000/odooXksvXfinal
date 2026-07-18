import { getDashboardOrders } from "../api/dashboard.api";

/**
 * Maps a raw order from the API into a UI-friendly shape.
 */
function mapOrderToRow(order) {
  const refNum = String(order.rent_id).padStart(5, "0");

  return {
    id: order.rent_id,
    orderRef: `SO${refNum}`,
    customer: order.customer_email?.split("@")[0] || "Unknown",
    customerEmail: order.customer_email,
    status: order.delivery_status || "reserved",
    invoiceStatus: order.invoice_status || "nothing_to_invoice",
    pickupDate: order.start_date,
    returnDate: order.end_date,
    pickupTime: order.pickup_time,
    returnTime: order.return_time,
    total: Number(order.total) || 0,
    deposit: Number(order.deposit) || 0,
    penalty: Number(order.penalty) || 0,
    productName: order.product_name,
    durationType: order.duration_type,
    createdAt: order.created_at,
  };
}

/**
 * Loads all dashboard orders and maps them to UI rows.
 */
export async function loadDashboardOrders() {
  const data = await getDashboardOrders();
  return (data.orders || []).map(mapOrderToRow);
}

/**
 * Computes summary stats from a list of mapped order rows.
 */
export function computeOrderStats(orders) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  let todayCount = 0;
  let pickupCount = 0;
  let returnCount = 0;
  let lateCount = 0;
  let totalSales = 0;
  let totalLateFees = 0;
  let totalDeposit = 0;

  for (const order of orders) {
    const startStr = order.pickupDate
      ? new Date(order.pickupDate).toISOString().split("T")[0]
      : null;
    const endStr = order.returnDate
      ? new Date(order.returnDate).toISOString().split("T")[0]
      : null;

    // Today: orders that are active today
    if (startStr <= todayStr && endStr >= todayStr) todayCount++;

    // Pickup: orders where pickup is today or in the future and status is reserved
    if (startStr >= todayStr && order.status === "reserved") pickupCount++;

    // Return: orders where return is today or in the past and status is picked_up
    if (endStr <= todayStr && order.status === "picked_up") returnCount++;

    // Late: orders past return date that haven't been returned
    if (
      endStr < todayStr &&
      !["returned", "cancelled"].includes(order.status)
    )
      lateCount++;

    totalSales += order.total;
    totalLateFees += order.penalty;
    totalDeposit += order.deposit;
  }

  return {
    todayCount,
    pickupCount,
    returnCount,
    lateCount,
    totalSales,
    totalLateFees,
    totalDeposit,
  };
}
