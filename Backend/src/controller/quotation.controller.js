import {
  createQuotation,
  getQuotationsByCompany,
  getQuotationById,
  confirmQuotation,
  convertQuotationToOrder
} from "../repository/quotation.repository.js";
import { findVendorById } from "../repository/vendor.repository.js";
import { sendEmail } from "../service/mail.service.js";
import { getPool } from "../config/database.js";
import {
  SELECT_USER_BY_EMAIL_QUERY,
  INSERT_GUEST_USER_QUERY,
  INSERT_ADDRESS_QUERY,
  INSERT_QUOTATION_QUERY
} from "../queries/quotation.query.js";

/**
 * Creates new quotations for multiple items (status = 'sent') and sends a consolidated summary email.
 * POST /api/quotations
 */
export async function createQuotationController(req, res, next) {
  try {
    const {
      customer_name,
      customer_email,
      items, // array of items: { p_id, r_id, quantity, start_date, end_date, total }
      u_id
    } = req.body;

    if (!customer_name || !customer_email || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing customer details or quotation lines" });
    }

    // 1. Fetch vendor to get scoped company c_id
    const vendor = await findVendorById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const c_id = vendor.c_id;
    const pool = getPool();

    // Resolve user ID if email exists in users
    let resolvedUserId = u_id || null;
    if (!resolvedUserId) {
      const userRes = await pool.query(SELECT_USER_BY_EMAIL_QUERY, [customer_email.trim()]);
      if (userRes.rows[0]) {
        resolvedUserId = userRes.rows[0].u_id;
      }
    }

    // Create address rows if custom address objects are passed
    let invoice_address_id = req.body.invoice_address_id || null;
    if (!invoice_address_id && req.body.invoiceAddress && req.body.invoiceAddress.address_line1) {
      // Ensure we have a customer record to link the address
      if (!resolvedUserId) {
        const nameParts = customer_name.trim().split(" ");
        const firstName = nameParts[0] || "Guest";
        const lastName = nameParts.slice(1).join(" ") || "Customer";
        const insertUserRes = await pool.query(INSERT_GUEST_USER_QUERY, [
          firstName,
          lastName,
          customer_email.trim().toLowerCase(),
          "guest_dummy_password"
        ]);
        resolvedUserId = insertUserRes.rows[0].u_id;
      }

      const resAddr = await pool.query(INSERT_ADDRESS_QUERY, [
        req.body.invoiceAddress.pincode || "",
        req.body.invoiceAddress.state || "",
        req.body.invoiceAddress.city || "",
        req.body.invoiceAddress.address_line1,
        req.body.invoiceAddress.address_line2 || null,
        resolvedUserId
      ]);
      invoice_address_id = resAddr.rows[0].address_id;
    }

    let delivery_address_id = req.body.delivery_address_id || null;
    if (!delivery_address_id && req.body.deliveryAddress && req.body.deliveryAddress.address_line1) {
      // Ensure we have a customer record to link the address
      if (!resolvedUserId) {
        const nameParts = customer_name.trim().split(" ");
        const firstName = nameParts[0] || "Guest";
        const lastName = nameParts.slice(1).join(" ") || "Customer";
        const insertUserRes = await pool.query(INSERT_GUEST_USER_QUERY, [
          firstName,
          lastName,
          customer_email.trim().toLowerCase(),
          "guest_dummy_password"
        ]);
        resolvedUserId = insertUserRes.rows[0].u_id;
      }

      const resAddr = await pool.query(INSERT_ADDRESS_QUERY, [
        req.body.deliveryAddress.pincode || "",
        req.body.deliveryAddress.state || "",
        req.body.deliveryAddress.city || "",
        req.body.deliveryAddress.address_line1,
        req.body.deliveryAddress.address_line2 || null,
        resolvedUserId
      ]);
      delivery_address_id = resAddr.rows[0].address_id;
    }

    const createdQuotations = [];
    // Use a shared sent_at timestamp to group items
    const sentAt = new Date();

    for (const item of items) {
      // Insert via query constant
      const qRes = await pool.query(INSERT_QUOTATION_QUERY, [
        c_id,
        item.p_id,
        item.r_id,
        resolvedUserId,
        customer_name,
        customer_email,
        Number(item.quantity),
        item.start_date,
        item.end_date,
        Number(item.total),
        "sent",
        sentAt
      ]);
      
      const detailedQ = await getQuotationById(qRes.rows[0].q_id);
      createdQuotations.push(detailedQ);
    }

    // 3. Send quotation email using SMTP
    const emailSubject = `Quotation Reference Summary from ${vendor.first_name} ${vendor.last_name}`;
    const emailLinesHtml = createdQuotations.map((q) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 0; font-weight: bold;">${q.product_name || "Product"}</td>
        <td style="padding: 10px 0; text-align: center;">${q.quantity}</td>
        <td style="padding: 10px 0; text-align: center;">${new Date(q.start_date).toLocaleDateString()} to ${new Date(q.end_date).toLocaleDateString()}</td>
        <td style="padding: 10px 0; font-weight: bold; text-align: right;">$${q.total}</td>
      </tr>
    `).join("");

    const grandTotal = createdQuotations.reduce((sum, q) => sum + Number(q.total), 0);

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #6366f1; margin: 0;">Zenith Rental Quotation Summary</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Thank you for your request details below:</p>
        </div>
        
        <p>Dear <strong>${customer_name}</strong>,</p>
        <p>We are pleased to provide you with the quotation details below:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b;">
                <th style="padding-bottom: 8px; text-align: left;">Product</th>
                <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                <th style="padding-bottom: 8px; text-align: center;">Period</th>
                <th style="padding-bottom: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${emailLinesHtml}
              <tr style="border-top: 2px solid #e2e8f0;">
                <td colspan="3" style="padding: 12px 0 0 0; font-size: 16px; font-weight: bold; color: #1e293b;">Total:</td>
                <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; color: #6366f1; text-align: right;">$${grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p style="font-size: 14px; color: #64748b; line-height: 1.5;">To confirm this quotation and initiate active bookings, please contact our support.</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">This email was sent automatically by Zenith Rental Management System.</p>
      </div>
    `;

    await sendEmail({
      to: customer_email,
      subject: emailSubject,
      text: `Zenith Rental Quotation Summary. Total: $${grandTotal.toFixed(2)}`,
      html: emailHtml
    });

    return res.status(201).json({
      message: "Quotations created and emailed successfully",
      quotation: createdQuotations[0],
      quotations: createdQuotations
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lists all quotations created by the vendor's company.
 * GET /api/quotations
 */
export async function getQuotationsController(req, res, next) {
  try {
    const vendor = await findVendorById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const quotations = await getQuotationsByCompany(vendor.c_id);
    return res.status(200).json({ quotations });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets a single quotation by ID.
 * GET /api/quotations/:q_id
 */
export async function getQuotationByIdController(req, res, next) {
  try {
    const { q_id } = req.params;
    const quotation = await getQuotationById(q_id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    return res.status(200).json({ quotation });
  } catch (error) {
    next(error);
  }
}

/**
 * Confirms a quotation (status = 'confirmed').
 * PUT /api/quotations/:q_id/confirm
 */
export async function confirmQuotationController(req, res, next) {
  try {
    const { q_id } = req.params;
    const quotation = await confirmQuotation(q_id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    return res.status(200).json({
      message: "Quotation confirmed successfully",
      quotation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Converts a confirmed quotation into an active rental order.
 * POST /api/quotations/:q_id/convert
 */
export async function convertQuotationController(req, res, next) {
  try {
    const { q_id } = req.params;
    const { invoice_address_id, delivery_address_id, invoiceAddress, deliveryAddress } = req.body;
    const order = await convertQuotationToOrder(q_id, {
      invoice_address_id,
      delivery_address_id,
      invoiceAddress,
      deliveryAddress
    });
    return res.status(201).json({
      message: "Quotation successfully converted to active renting order",
      order
    });
  } catch (error) {
    next(error);
  }
}
