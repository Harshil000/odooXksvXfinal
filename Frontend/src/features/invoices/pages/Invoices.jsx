import { useState } from "react";
import Navbar from "../../dashboard/components/Navbar";
import { sendInvoice } from "../api/invoice.api";
import { useInvoices } from "../hooks/useInvoices";
import { formatCurrency, formatDate } from "../utils/invoice.util";
import "../styles/Invoices.scss";

const Invoices = () => {
  const [viewingInvoiceEmail, setViewingInvoiceEmail] = useState(null);
  const {
    invoices,
    selectedCustomer,
    setSelectedCustomer,
    selectedInvoice,
    selectedInvoiceAddressId,
    setSelectedInvoiceAddressId,
    selectedDeliveryAddressId,
    setSelectedDeliveryAddressId,
    totals,
    status,
    setStatus,
    loading,
    error,
  } = useInvoices();

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async () => {
    if (!selectedInvoice) {
      alert("Choose a customer before sending invoice.");
      return;
    }

    try {
      await sendInvoice({
        customerEmail: selectedInvoice.customerEmail,
        invoiceNumber: selectedInvoice.invoiceNumber,
        invoiceDate: formatDate(selectedInvoice.invoiceDate),
        invoiceAddress: selectedInvoice.invoiceAddress,
        deliveryAddress: selectedInvoice.deliveryAddress,
        lines: selectedInvoice.lines,
        totals,
      });
      alert("Invoice sent successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to send invoice: " + (err.message || "Unable to send invoice"));
    }
  };

  return (
    <div className="invoice-page">
      <Navbar activeSection="invoices" searchQuery="" onSearchChange={() => {}} searchPlaceholder="Search invoices..." />

      <main className="invoice-content">
        <section className="invoice-card">
          <div className="invoice-topbar">
            <div className="invoice-topbar__left">
              <button type="button" className="invoice-new-btn">Invoices</button>
            </div>
          </div>

          {viewingInvoiceEmail && (
            <div className="invoice-actions">
              <button type="button" onClick={handleSend}>Send</button>
              <button type="button" onClick={handlePrint}>Print</button>
              <button type="button">Pay</button>
              <div className="invoice-status-toggle">
                <button
                  type="button"
                  className={status === "draft" ? "active" : ""}
                  onClick={() => setStatus("draft")}
                >
                  Draft
                </button>
                <button
                  type="button"
                  className={status === "posted" ? "active" : ""}
                  onClick={() => setStatus("posted")}
                >
                  Posted
                </button>
              </div>
            </div>
          )}

          {error && <div className="invoice-error">{error.message || "Unable to load invoices."}</div>}

          {loading ? (
            <div className="invoice-loading">Loading invoice data...</div>
          ) : !viewingInvoiceEmail ? (
            <div className="invoice-history-list" style={{ marginTop: "24px" }}>
              <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-primary)" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Invoice Number</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Customer</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Email</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Date</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Total Amount</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const invTotal = inv.lines.reduce((sum, line) => sum + line.amount, 0);
                      const totalWithTax = invTotal * 1.10;
                      return (
                        <tr 
                          key={inv.customerEmail} 
                          onClick={() => {
                            setSelectedCustomer(inv.customerEmail);
                            setViewingInvoiceEmail(inv.customerEmail);
                          }}
                          style={{ cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "background 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "14px 16px", fontWeight: "600", color: "var(--accent)" }}>{inv.invoiceNumber}</td>
                          <td style={{ padding: "14px 16px" }}>{inv.customerName}</td>
                          <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{inv.customerEmail}</td>
                          <td style={{ padding: "14px 16px" }}>{formatDate(inv.invoiceDate)}</td>
                          <td style={{ padding: "14px 16px", fontWeight: "bold" }}>{formatCurrency(totalWithTax)}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", background: "rgba(163, 140, 245, 0.15)", color: "var(--accent)" }}>
                              {inv.status || "draft"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                          No invoice history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <button 
                type="button" 
                onClick={() => setViewingInvoiceEmail(null)} 
                style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", padding: "6px 14px", borderRadius: "4px", marginBottom: "20px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                &larr; Back to Invoices
              </button>

              <h1>{selectedInvoice?.invoiceNumber || "INV/2026/0001"}</h1>

              <div className="invoice-form-grid">
                <div className="invoice-field">
                  <label htmlFor="invoice-customer">Customer</label>
                  <select
                    id="invoice-customer"
                    value={selectedCustomer}
                    onChange={(event) => setSelectedCustomer(event.target.value)}
                  >
                    <option value="">Select customer</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.customerEmail} value={invoice.customerEmail}>
                        {invoice.customerEmail}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="invoice-field">
                  <label>Invoice Date</label>
                  <input value={formatDate(selectedInvoice?.invoiceDate)} readOnly />
                </div>

                <div className="invoice-field">
                  <label>Invoice Address</label>
                  <select
                    value={selectedInvoiceAddressId}
                    onChange={(event) => setSelectedInvoiceAddressId(event.target.value)}
                  >
                    <option value="">Select invoice address</option>
                    {selectedInvoice?.addresses.map((address) => (
                      <option key={address.address_id} value={address.address_id}>
                        {[address.address_line1, address.city, address.state, address.pincode].filter(Boolean).join(", ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="invoice-field">
                  <label>Delivery Address</label>
                  <select
                    value={selectedDeliveryAddressId}
                    onChange={(event) => setSelectedDeliveryAddressId(event.target.value)}
                  >
                    <option value="">Select delivery address</option>
                    {selectedInvoice?.addresses.map((address) => (
                      <option key={address.address_id} value={address.address_id}>
                        {[address.address_line1, address.city, address.state, address.pincode].filter(Boolean).join(", ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <section className="invoice-lines">
                <div className="invoice-lines__tab">Invoice Lines</div>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Unit Price</th>
                      <th>Taxes</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice?.lines.length ? (
                      selectedInvoice.lines.map((line) => (
                        <tr key={line.id}>
                          <td>
                            <strong>{line.productName}</strong>
                            <span>[{formatDate(line.startDate)} - {formatDate(line.endDate)}]</span>
                          </td>
                          <td>{line.quantity}</td>
                          <td>{line.unit}</td>
                          <td>{formatCurrency(line.unitPrice)}</td>
                          <td>{line.taxRate} %</td>
                          <td>{formatCurrency(line.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="invoice-empty">Choose a customer to auto-fill invoice lines.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <div className="invoice-footer">
                <div className="invoice-links">
                  <button type="button">Add a Product</button>
                  <button type="button">Add a note</button>
                </div>
                <div className="invoice-totals">
                  <div><span>Untaxed Amount:</span><strong>{formatCurrency(totals.untaxed)}</strong></div>
                  <div><span>Taxes:</span><strong>{formatCurrency(totals.taxes)}</strong></div>
                  <div className="invoice-total"><span>Total:</span><strong>{formatCurrency(totals.total)}</strong></div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default Invoices;
