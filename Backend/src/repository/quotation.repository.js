import { getPool } from "../config/database.js";
import {
  INSERT_QUOTATION_QUERY,
  SELECT_QUOTATIONS_BY_COMPANY_QUERY,
  SELECT_QUOTATION_BY_ID_QUERY,
  SELECT_QUOTATION_GROUP_QUERY,
  UPDATE_QUOTATION_STATUS_QUERY,
  UPDATE_QUOTATION_GROUP_CONFIRMED_QUERY,
  UPDATE_QUOTATION_CONVERTED_QUERY,
  SELECT_FREE_ASSET_QUERY,
  SELECT_QUOTATION_RAW_GROUP_QUERY,
  SELECT_USER_BY_EMAIL_QUERY,
  INSERT_GUEST_USER_QUERY,
  INSERT_ADDRESS_QUERY,
  SELECT_ADDRESS_BY_USER_QUERY,
  SELECT_RENT_PLAN_DEPOSIT_QUERY,
  INSERT_RENTING_ORDER_QUERY
} from "../queries/quotation.query.js";

/**
 * Finds a free asset for a product in the given rental window.
 * Only returns assets that are not already booked in the requested window.
 */
async function findFreeAsset(p_id, startDate, endDate, client) {
  const res = await client.query(SELECT_FREE_ASSET_QUERY, [p_id, startDate, endDate]);
  if (res.rows[0]) {
    return res.rows[0].asset_id;
  }

  return null;
}

export async function createQuotation(data) {
  const pool = getPool();
  const result = await pool.query(INSERT_QUOTATION_QUERY, [
    data.c_id,
    data.p_id,
    data.r_id,
    data.u_id || null,
    data.customer_name,
    data.customer_email,
    data.quantity,
    data.start_date,
    data.end_date,
    data.total,
    data.status || "sent",
    new Date()
  ]);
  return result.rows[0];
}

export async function getQuotationsByCompany(c_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_QUOTATIONS_BY_COMPANY_QUERY, [c_id]);
  return result.rows;
}

export async function getQuotationById(q_id) {
  const pool = getPool();
  // 1. Fetch primary quotation row
  const primaryRes = await pool.query(SELECT_QUOTATION_BY_ID_QUERY, [q_id]);
  const primary = primaryRes.rows[0];
  if (!primary) return null;

  // 2. Fetch all other quotation rows sent at the same time to the same email
  const groupRes = await pool.query(SELECT_QUOTATION_GROUP_QUERY, [primary.customer_email, primary.sent_at]);
  return {
    ...primary,
    items: groupRes.rows
  };
}

export async function confirmQuotation(q_id) {
  const pool = getPool();
  // 1. Get primary quotation to resolve email and sent_at
  const primaryRes = await pool.query(SELECT_QUOTATION_BY_ID_QUERY, [q_id]);
  const primary = primaryRes.rows[0];
  if (!primary) return null;

  // 2. Update status of all matching quotations in the group
  const result = await pool.query(UPDATE_QUOTATION_GROUP_CONFIRMED_QUERY, [primary.customer_email, primary.sent_at]);
  return result.rows[0] || null;
}

export async function convertQuotationToOrder(q_id, addressData = {}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Fetch primary quotation details
    const primaryRes = await client.query(SELECT_QUOTATION_BY_ID_QUERY, [q_id]);
    const primary = primaryRes.rows[0];
    if (!primary) {
      throw new Error("Quotation not found");
    }

    // 2. Fetch all items in group
    const groupRes = await client.query(SELECT_QUOTATION_RAW_GROUP_QUERY, [primary.customer_email, primary.sent_at]);
    const items = groupRes.rows;

    const createdOrders = [];

    for (const quote of items) {
      if (quote.status === "converted") {
        continue; // skip already converted items
      }

      // Resolve user account
      const userRes = await client.query(SELECT_USER_BY_EMAIL_QUERY, [quote.customer_email.trim()]);
      let resolvedUserId;
      if (userRes.rows[0]) {
        resolvedUserId = userRes.rows[0].u_id;
      } else {
        // Create guest user
        const nameParts = quote.customer_name.trim().split(" ");
        const firstName = nameParts[0] || "Guest";
        const lastName = nameParts.slice(1).join(" ") || "Customer";
        const insertUserRes = await client.query(INSERT_GUEST_USER_QUERY, [
          firstName,
          lastName,
          quote.customer_email.trim().toLowerCase(),
          "guest_dummy_password"
        ]);
        resolvedUserId = insertUserRes.rows[0].u_id;
      }

      // Resolve address IDs
      let resolvedInvoiceAddressId = addressData.invoice_address_id;
      if (!resolvedInvoiceAddressId && addressData.invoiceAddress && addressData.invoiceAddress.addressLine1) {
        const resAddr = await client.query(INSERT_ADDRESS_QUERY, [
          addressData.invoiceAddress.pincode || "",
          addressData.invoiceAddress.state || "",
          addressData.invoiceAddress.city || "",
          addressData.invoiceAddress.addressLine1,
          addressData.invoiceAddress.addressLine2 || null,
          resolvedUserId
        ]);
        resolvedInvoiceAddressId = resAddr.rows[0].address_id;
      }

      let resolvedDeliveryAddressId = addressData.delivery_address_id;
      if (!resolvedDeliveryAddressId && addressData.deliveryAddress && addressData.deliveryAddress.addressLine1) {
        const resAddr = await client.query(INSERT_ADDRESS_QUERY, [
          addressData.deliveryAddress.pincode || "",
          addressData.deliveryAddress.state || "",
          addressData.deliveryAddress.city || "",
          addressData.deliveryAddress.addressLine1,
          addressData.deliveryAddress.addressLine2 || null,
          resolvedUserId
        ]);
        resolvedDeliveryAddressId = resAddr.rows[0].address_id;
      }

      // Fallbacks
      if (!resolvedInvoiceAddressId) {
        const addrRes = await client.query(SELECT_ADDRESS_BY_USER_QUERY, [resolvedUserId]);
        if (addrRes.rows[0]) resolvedInvoiceAddressId = addrRes.rows[0].address_id;
      }
      if (!resolvedDeliveryAddressId) {
        const addrRes = await client.query(SELECT_ADDRESS_BY_USER_QUERY, [resolvedUserId]);
        if (addrRes.rows[0]) resolvedDeliveryAddressId = addrRes.rows[0].address_id;
      }

      // Fetch security deposit
      const planRes = await client.query(SELECT_RENT_PLAN_DEPOSIT_QUERY, [quote.r_id]);
      const depositAmount = planRes.rows[0] ? Number(planRes.rows[0].deposit || 0) : 0;
      const quantity = Math.max(1, Number(quote.quantity || 1));
      const totalPerUnit = Number(quote.total || 0) / quantity;
      const depositPerUnit = depositAmount / quantity;

      const quoteQty = Number(quote.quantity || 1);
      const unitTotal = Number(quote.total || 0) / quoteQty;

      // Verify stock availability with lock
      const productRes = await client.query("SELECT quantity, pname FROM products WHERE p_id = $1 FOR UPDATE;", [quote.p_id]);
      const product = productRes.rows[0];
      if (!product) {
        throw new Error("Product not found");
      }
      if (Number(product.quantity || 0) < quoteQty) {
        throw new Error(`Insufficient stock for product "${product.pname}". Available: ${product.quantity}, requested: ${quoteQty}`);
      }

      for (let q = 0; q < quoteQty; q++) {
        // Locate or create a free asset
        const assetId = await findOrCreateFreeAsset(quote.p_id, quote.start_date, quote.end_date, client);

        // Insert Renting Order
        const orderRes = await client.query(INSERT_RENTING_ORDER_QUERY, [
          quote.r_id,
          assetId,
          resolvedUserId,
          resolvedInvoiceAddressId,
          resolvedDeliveryAddressId,
          quote.customer_email,
          quote.start_date,
          quote.end_date,
          "reserved",
          "confirmed",
          unitTotal, // total (rent charge only per unit)
          "pending",
          depositAmount
        ]);
        const createdOrder = orderRes.rows[0];

        // Update Quotation Status to 'converted'
        await client.query(UPDATE_QUOTATION_CONVERTED_QUERY, [
          createdOrder.rent_id,
          quote.q_id
        ]);

        createdOrders.push(createdOrder);

        // Decrement available product quantity by 1
        await client.query(
          `UPDATE products 
           SET quantity = GREATEST(0, quantity - 1) 
           WHERE p_id = $1`,
          [quote.p_id]
        );
      }
    }

    await client.query("COMMIT");
    // Return first order details for response payload mapping
    return createdOrders[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
