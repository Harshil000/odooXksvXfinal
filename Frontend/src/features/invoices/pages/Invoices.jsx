import Navbar from "../../dashboard/components/Navbar";
import { sendInvoice } from "../api/invoice.api";
import { useInvoices } from "../hooks/useInvoices";
import { formatCurrency, formatDate } from "../utils/invoice.util";
import "../styles/Invoices.scss";

const Invoices = () => {
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
              <button type="button" className="invoice-new-btn">New</button>
              <button type="button" className="invoice-icon-btn">✓</button>
              <button type="button" className="invoice-icon-btn invoice-icon-btn--danger">×</button>
            </div>
          </div>

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

          {error && <div className="invoice-error">{error.message || "Unable to load invoices."}</div>}

          {loading ? (
            <div className="invoice-loading">Loading invoice data...</div>
          ) : (
            <>
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
