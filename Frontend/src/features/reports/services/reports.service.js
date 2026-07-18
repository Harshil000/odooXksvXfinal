import { getReportOrders } from "../api/reports.api";
import { buildProductSalesReport, calculateReportTotals } from "../utils/report.mapper";
import { downloadFile, formatCurrency, getMonthLabel } from "../utils/report.util";

export async function loadMonthlyProductSales(monthValue) {
  const data = await getReportOrders();
  const rows = buildProductSalesReport(data.orders || [], monthValue);

  return {
    rows,
    totals: calculateReportTotals(rows),
  };
}

export function exportReportCsv(rows, totals, monthValue) {
  const header = ["Product", "Orders", "Quantity", "Sales", "Deposits", "Late Penalties"];
  const lines = rows.map((row) => [
    row.productName,
    row.orderCount,
    row.quantity,
    row.sales,
    row.deposits,
    row.penalties,
  ]);
  lines.push(["TOTAL", totals.orderCount, totals.quantity, totals.sales, totals.deposits, totals.penalties]);

  const csv = [header, ...lines]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  downloadFile(`product-sales-${monthValue}.csv`, csv, "text/csv;charset=utf-8");
}

export function exportReportExcel(rows, totals, monthValue) {
  const tableRows = rows.map((row) => `
    <tr>
      <td>${row.productName}</td>
      <td>${row.orderCount}</td>
      <td>${row.quantity}</td>
      <td>${formatCurrency(row.sales)}</td>
      <td>${formatCurrency(row.deposits)}</td>
      <td>${formatCurrency(row.penalties)}</td>
    </tr>
  `).join("");

  const html = `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <h1>Product Sales Report - ${getMonthLabel(monthValue)}</h1>
        <table border="1">
          <thead>
            <tr>
              <th>Product</th><th>Orders</th><th>Quantity</th><th>Sales</th><th>Deposits</th><th>Late Penalties</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr>
              <th>TOTAL</th>
              <th>${totals.orderCount}</th>
              <th>${totals.quantity}</th>
              <th>${formatCurrency(totals.sales)}</th>
              <th>${formatCurrency(totals.deposits)}</th>
              <th>${formatCurrency(totals.penalties)}</th>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;

  downloadFile(`product-sales-${monthValue}.xls`, html, "application/vnd.ms-excel;charset=utf-8");
}
