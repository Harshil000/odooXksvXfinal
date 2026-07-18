import {
  createQuotation,
  getQuotationsByCompany,
  getQuotationById,
  confirmQuotation,
  convertQuotationToOrder
} from "../repository/quotation.repository.js";
import { findVendorById } from "../repository/vendor.repository.js";
import { sendEmail } from "../service/mail.service.js";

/**
 * Creates a new quotation (status = 'sent') and sends the quotation email.
 * POST /api/quotations
 */
export async function createQuotationController(req, res, next) {
  try {
    const {
      p_id,
      r_id,
      customer_name,
      customer_email,
      quantity,
      start_date,
      end_date,
      total,
      u_id
    } = req.body;

    if (!p_id || !r_id || !customer_name || !customer_email || !quantity || !start_date || !end_date || total === undefined) {
      return res.status(400).json({ message: "Missing required quotation fields" });
    }

    // 1. Fetch vendor to get scoped company c_id
    const vendor = await findVendorById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const c_id = vendor.c_id;

    // 2. Insert into database
    const quotation = await createQuotation({
      c_id,
      p_id,
      r_id,
      u_id,
      customer_name,
      customer_email,
      quantity: Number(quantity),
      start_date,
      end_date,
      total: Number(total),
      status: "sent"
    });

    // Fetch the detailed quotation with relation joins for the email
    const detailedQuotation = await getQuotationById(quotation.q_id);

    // 3. Send quotation email using SMTP
    const emailSubject = `Quotation Reference #${detailedQuotation.q_id} from ${vendor.first_name} ${vendor.last_name}`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #6366f1; margin: 0;">Rental Quotation</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Quote Reference: #Q-${detailedQuotation.q_id}</p>
        </div>
        
        <p>Dear <strong>${detailedQuotation.customer_name}</strong>,</p>
        <p>We are pleased to provide you with the quotation for your rental request details below:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Product Name:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${detailedQuotation.product_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Quantity:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${detailedQuotation.quantity}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Duration:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">
                ${new Date(detailedQuotation.start_date).toLocaleDateString()} to ${new Date(detailedQuotation.end_date).toLocaleDateString()}
              </td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: bold; color: #1e293b;">Total Amount:</td>
              <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; color: #6366f1; text-align: right;">$${detailedQuotation.total}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 14px; color: #64748b; line-height: 1.5;">To confirm this quotation and process it to an active rental order, please get in touch with our team.</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">This email was sent automatically by Zenith Rental Management System.</p>
      </div>
    `;

    await sendEmail({
      to: detailedQuotation.customer_email,
      subject: emailSubject,
      text: `Zenith Rental Quotation #${detailedQuotation.q_id} for ${detailedQuotation.product_name}. Total: $${detailedQuotation.total}`,
      html: emailHtml
    });

    return res.status(201).json({
      message: "Quotation created and emailed successfully",
      quotation: detailedQuotation
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
