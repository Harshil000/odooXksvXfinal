import { useEffect, useMemo, useState } from "react";
import { loadCustomerInvoices } from "../services/invoice.service";
import { calculateInvoiceTotals } from "../utils/invoice.mapper";
import { formatAddress } from "../utils/invoice.util";

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedInvoiceAddressId, setSelectedInvoiceAddressId] = useState("");
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState("");
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchInvoices() {
      try {
        const rows = await loadCustomerInvoices();
        if (active) {
          setInvoices(rows);
          setSelectedCustomer(rows[0]?.customerEmail || "");
          setSelectedInvoiceAddressId(rows[0]?.invoiceAddressId || "");
          setSelectedDeliveryAddressId(rows[0]?.deliveryAddressId || "");
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err);
          console.error("Error loading invoices:", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchInvoices();

    return () => {
      active = false;
    };
  }, []);

  const selectedInvoice = useMemo(() => (
    invoices.find((invoice) => invoice.customerEmail === selectedCustomer) || null
  ), [invoices, selectedCustomer]);

  const selectedInvoiceAddress = useMemo(() => (
    selectedInvoice?.addresses.find((address) => address.address_id === selectedInvoiceAddressId) || null
  ), [selectedInvoice, selectedInvoiceAddressId]);

  const selectedDeliveryAddress = useMemo(() => (
    selectedInvoice?.addresses.find((address) => address.address_id === selectedDeliveryAddressId) || null
  ), [selectedInvoice, selectedDeliveryAddressId]);

  const selectedInvoiceView = useMemo(() => {
    if (!selectedInvoice) return null;

    return {
      ...selectedInvoice,
      invoiceAddressId: selectedInvoiceAddressId,
      deliveryAddressId: selectedDeliveryAddressId,
      invoiceAddress: formatAddress(selectedInvoiceAddress),
      deliveryAddress: formatAddress(selectedDeliveryAddress),
    };
  }, [selectedInvoice, selectedInvoiceAddress, selectedInvoiceAddressId, selectedDeliveryAddress, selectedDeliveryAddressId]);

  const totals = useMemo(() => (
    selectedInvoiceView ? calculateInvoiceTotals(selectedInvoiceView) : { untaxed: 0, taxes: 0, total: 0 }
  ), [selectedInvoiceView]);

  const selectCustomer = (customerEmail) => {
    const invoice = invoices.find((item) => item.customerEmail === customerEmail);
    setSelectedCustomer(customerEmail);
    setSelectedInvoiceAddressId(invoice?.invoiceAddressId || "");
    setSelectedDeliveryAddressId(invoice?.deliveryAddressId || "");
  };

  return {
    invoices,
    selectedCustomer,
    setSelectedCustomer: selectCustomer,
    selectedInvoice: selectedInvoiceView,
    selectedInvoiceAddressId,
    setSelectedInvoiceAddressId,
    selectedDeliveryAddressId,
    setSelectedDeliveryAddressId,
    totals,
    status,
    setStatus,
    loading,
    error,
  };
}
