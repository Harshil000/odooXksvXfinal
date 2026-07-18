export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildInvoiceNumber(date = new Date()) {
  return `INV/${date.getFullYear()}/0001`;
}

export function formatAddress(address) {
  if (!address) return "Not selected";
  return [
    address.address_line1,
    address.address_line2,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean).join(", ");
}

export function getRentalQuantity(order) {
  return Number(order.quantity || 1);
}

export function getUnitPrice(order) {
  const quantity = getRentalQuantity(order);
  return quantity > 0 ? Number(order.total || 0) / quantity : Number(order.total || 0);
}
