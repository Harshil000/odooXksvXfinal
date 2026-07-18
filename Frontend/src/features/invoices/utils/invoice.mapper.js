import { buildInvoiceNumber, formatAddress, getRentalQuantity, getUnitPrice } from "./invoice.util";

function normalizeAddresses(addresses) {
  if (!Array.isArray(addresses)) return [];
  const seen = new Set();

  return addresses.filter((address) => {
    if (!address?.address_id || seen.has(address.address_id)) return false;
    seen.add(address.address_id);
    return true;
  });
}

export function mapOrdersToCustomerInvoices(orders) {
  const grouped = new Map();

  for (const order of orders) {
    const email = order.customer_email || order.email;
    if (!email) continue;

    if (!grouped.has(email)) {
      const addresses = normalizeAddresses(order.customer_addresses);
      const invoiceAddress = addresses.find((address) => address.address_id === order.invoice_address_id) || addresses[0] || null;
      const deliveryAddress = addresses.find((address) => address.address_id === order.delivery_address_id) || invoiceAddress;

      grouped.set(email, {
        customerEmail: email,
        customerName: `${order.customer_first_name || ""} ${order.customer_last_name || ""}`.trim() || email.split("@")[0],
        customerId: order.customer_id,
        invoiceNumber: buildInvoiceNumber(),
        invoiceDate: new Date().toISOString(),
        addresses,
        invoiceAddressId: invoiceAddress?.address_id || "",
        deliveryAddressId: deliveryAddress?.address_id || "",
        invoiceAddress: formatAddress(invoiceAddress),
        deliveryAddress: formatAddress(deliveryAddress),
        status: "draft",
        lines: [],
      });
    } else {
      const invoice = grouped.get(email);
      const addresses = normalizeAddresses([...invoice.addresses, ...(order.customer_addresses || [])]);
      invoice.addresses = addresses;
    }

    grouped.get(email).lines.push({
      id: order.rent_id,
      productName: order.product_name || "Product",
      startDate: order.start_date,
      endDate: order.end_date,
      quantity: getRentalQuantity(order),
      unit: "Units",
      unitPrice: getUnitPrice(order),
      taxRate: 10,
      amount: Number(order.total || 0),
    });
  }

  return Array.from(grouped.values());
}

export function calculateInvoiceTotals(invoice) {
  const untaxed = invoice.lines.reduce((sum, line) => sum + line.amount, 0);
  const taxes = invoice.lines.reduce((sum, line) => sum + (line.amount * line.taxRate) / 100, 0);

  return {
    untaxed,
    taxes,
    total: untaxed + taxes,
  };
}
