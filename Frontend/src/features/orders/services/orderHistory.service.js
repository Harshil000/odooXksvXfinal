import { getMyOrderHistory } from "../api/orderHistory.api";

function formatOrderRef(rentId) {
  return `SO${String(rentId).padStart(5, "0")}`;
}

export async function loadMyOrderHistory() {
  const data = await getMyOrderHistory();
  return (data.orders || []).map((order) => ({
    id: order.rent_id,
    orderRef: formatOrderRef(order.rent_id),
    productName: order.product_name,
    assetId: order.asset_id,
    startDate: order.start_date,
    endDate: order.end_date,
    status: order.delivery_status || "reserved",
    invoiceStatus: order.invoice_status || "nothing_to_invoice",
    total: Number(order.total || 0),
    deposit: Number(order.deposit || 0),
    planPrice: Number(order.plan_price || 0),
    durationType: order.duration_type,
    createdAt: order.created_at,
  }));
}
