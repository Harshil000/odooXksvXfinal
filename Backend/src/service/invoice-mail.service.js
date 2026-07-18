import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatCurrency(amount) {
  return `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;
}

export async function sendInvoiceEmail({ to, invoiceNumber, invoiceDate, invoiceAddress, deliveryAddress, lines, totals }) {
  const transporter = createTransporter();
  const rows = (lines || []).map((line) => `
    <tr>
      <td>${line.productName}</td>
      <td>${line.quantity}</td>
      <td>${line.unit}</td>
      <td>${formatCurrency(line.unitPrice)}</td>
      <td>${line.taxRate}%</td>
      <td>${formatCurrency(line.amount)}</td>
    </tr>
  `).join("");

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: `Invoice ${invoiceNumber}`,
    html: `
      <h2>Invoice ${invoiceNumber}</h2>
      <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
      <p><strong>Invoice Address:</strong> ${invoiceAddress || "Not selected"}</p>
      <p><strong>Delivery Address:</strong> ${deliveryAddress || "Not selected"}</p>
      <table border="1" cellpadding="8" cellspacing="0">
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
        <tbody>${rows}</tbody>
      </table>
      <p><strong>Untaxed Amount:</strong> ${formatCurrency(totals?.untaxed)}</p>
      <p><strong>Taxes:</strong> ${formatCurrency(totals?.taxes)}</p>
      <h3>Total: ${formatCurrency(totals?.total)}</h3>
    `,
  });
}
