import { getInvoiceOrders } from "../api/invoice.api";
import { mapOrdersToCustomerInvoices } from "../utils/invoice.mapper";

export async function loadCustomerInvoices() {
  const data = await getInvoiceOrders();
  return mapOrdersToCustomerInvoices(data.orders || []);
}
