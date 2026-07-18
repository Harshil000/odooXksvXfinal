import { isInMonth } from "./report.util";

export function buildProductSalesReport(orders, monthValue) {
  const grouped = new Map();

  for (const order of orders) {
    if (!isInMonth(order.start_date, monthValue)) continue;

    const productId = order.p_id;
    const current = grouped.get(productId) || {
      productId,
      productName: order.product_name || "Product",
      orderCount: 0,
      quantity: 0,
      sales: 0,
      deposits: 0,
      penalties: 0,
    };

    current.orderCount += 1;
    current.quantity += Number(order.quantity || 1);
    current.sales += Number(order.total || 0);
    current.deposits += Number(order.deposit || 0);
    current.penalties += Number(order.calculated_penalty || 0);

    grouped.set(productId, current);
  }

  return Array.from(grouped.values()).sort((a, b) => b.sales - a.sales);
}

export function calculateReportTotals(rows) {
  return rows.reduce((totals, row) => ({
    orderCount: totals.orderCount + row.orderCount,
    quantity: totals.quantity + row.quantity,
    sales: totals.sales + row.sales,
    deposits: totals.deposits + row.deposits,
    penalties: totals.penalties + row.penalties,
  }), {
    orderCount: 0,
    quantity: 0,
    sales: 0,
    deposits: 0,
    penalties: 0,
  });
}
