import { getPool } from "../config/database.js";
import {
  INSERT_QUOTATION_QUERY,
  SELECT_QUOTATIONS_BY_COMPANY_QUERY,
  SELECT_QUOTATION_BY_ID_QUERY,
  UPDATE_QUOTATION_STATUS_QUERY,
  UPDATE_QUOTATION_CONVERTED_QUERY
} from "../queries/quotation.query.js";

/**
 * Finds a free asset for a product in the given rental window.
 * Falls back to any asset, or creates a mock asset if none exist, ensuring checkout never blocks.
 */
async function findOrCreateFreeAsset(p_id, startDate, endDate, client) {
  const freeAssetQuery = `
    SELECT a.asset_id 
    FROM assets a
    WHERE a.p_id = $1
      AND a.asset_id NOT IN (
        SELECT ro.asset_id 
        FROM renting_orders ro
        WHERE ro.delivery_status NOT IN ('returned', 'cancelled')
          AND NOT (ro.end_date <= $2 OR ro.start_date >= $3)
      )
    LIMIT 1;
  `;
  const res = await client.query(freeAssetQuery, [p_id, startDate, endDate]);
  if (res.rows[0]) {
    return res.rows[0].asset_id;
  }

  const anyAssetQuery = `SELECT asset_id FROM assets WHERE p_id = $1 LIMIT 1;`;
  const anyAssetRes = await client.query(anyAssetQuery, [p_id]);
  if (anyAssetRes.rows[0]) {
    return anyAssetRes.rows[0].asset_id;
  }

  // Auto-generate fallback asset
  const createAssetQuery = `
    INSERT INTO assets (p_id, qr) 
    VALUES ($1, $2) 
    RETURNING asset_id;
  `;
  const fallbackQr = `FALLBACK-${p_id.slice(0, 8)}-${Date.now()}`;
  const createRes = await client.query(createAssetQuery, [p_id, fallbackQr]);
  return createRes.rows[0].asset_id;
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
    data.status || "sent"
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
  const result = await pool.query(SELECT_QUOTATION_BY_ID_QUERY, [q_id]);
  return result.rows[0] || null;
}

export async function confirmQuotation(q_id) {
  const pool = getPool();
  const result = await pool.query(UPDATE_QUOTATION_STATUS_QUERY, [
    "confirmed",
    new Date(),
    q_id
  ]);
  return result.rows[0] || null;
}

export async function convertQuotationToOrder(q_id, addressData = {}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Fetch quotation details
    const quoteRes = await client.query(SELECT_QUOTATION_BY_ID_QUERY, [q_id]);
    const quote = quoteRes.rows[0];

    if (!quote) {
      throw new Error("Quotation not found");
    }
    if (quote.status === "converted") {
      throw new Error("Quotation is already converted to a rental order");
    }

    // 2. Locate or create a free asset
    const assetId = await findOrCreateFreeAsset(quote.p_id, quote.start_date, quote.end_date, client);

    // 3. Resolve if a registered user exists for the email to link them
    const userRes = await client.query("SELECT u_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [quote.customer_email.trim()]);
    let resolvedUserId;
    if (userRes.rows[0]) {
      resolvedUserId = userRes.rows[0].u_id;
    } else {
      // Create guest user
      const nameParts = quote.customer_name.trim().split(" ");
      const firstName = nameParts[0] || "Guest";
      const lastName = nameParts.slice(1).join(" ") || "Customer";
      const insertUserRes = await client.query(
        `INSERT INTO users (first_name, last_name, email, password)
         VALUES ($1, $2, $3, $4)
         RETURNING u_id`,
        [firstName, lastName, quote.customer_email.trim().toLowerCase(), "guest_dummy_password"]
      );
      resolvedUserId = insertUserRes.rows[0].u_id;
    }

    // 4. Resolve address IDs
    let resolvedInvoiceAddressId = addressData.invoice_address_id;
    if (!resolvedInvoiceAddressId && addressData.invoiceAddress && addressData.invoiceAddress.addressLine1) {
      const insertAddressQuery = `
        INSERT INTO addresses (pincode, state, city, address_line1, address_line2, u_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING address_id
      `;
      const resAddr = await client.query(insertAddressQuery, [
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
      const insertAddressQuery = `
        INSERT INTO addresses (pincode, state, city, address_line1, address_line2, u_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING address_id
      `;
      const resAddr = await client.query(insertAddressQuery, [
        addressData.deliveryAddress.pincode || "",
        addressData.deliveryAddress.state || "",
        addressData.deliveryAddress.city || "",
        addressData.deliveryAddress.addressLine1,
        addressData.deliveryAddress.addressLine2 || null,
        resolvedUserId
      ]);
      resolvedDeliveryAddressId = resAddr.rows[0].address_id;
    }

    // Fallbacks if still no addresses resolved, select first address of the user if exists
    if (!resolvedInvoiceAddressId) {
      const addrRes = await client.query("SELECT address_id FROM addresses WHERE u_id = $1 LIMIT 1", [resolvedUserId]);
      if (addrRes.rows[0]) {
        resolvedInvoiceAddressId = addrRes.rows[0].address_id;
      }
    }
    if (!resolvedDeliveryAddressId) {
      const addrRes = await client.query("SELECT address_id FROM addresses WHERE u_id = $1 LIMIT 1", [resolvedUserId]);
      if (addrRes.rows[0]) {
        resolvedDeliveryAddressId = addrRes.rows[0].address_id;
      }
    }

    // 5. Fetch security deposit from rent plan details
    const planRes = await client.query("SELECT deposit FROM rent_plans WHERE r_id = $1", [quote.r_id]);
    const depositAmount = planRes.rows[0] ? Number(planRes.rows[0].deposit || 0) : 0;

    // 6. Insert Renting Order
    const insertOrderQuery = `
      INSERT INTO renting_orders (
        r_id,
        asset_id,
        u_id,
        invoice_address_id,
        delivery_address_id,
        email,
        start_date,
        end_date,
        delivery_status,
        invoice_status,
        total,
        payment_status,
        deposit_amount,
        deposit_refunded_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0)
      RETURNING *;
    `;

    const orderRes = await client.query(insertOrderQuery, [
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
      quote.total,
      "pending",
      depositAmount
    ]);
    const createdOrder = orderRes.rows[0];

    // 7. Update Quotation Status to 'converted' and link rent_id
    await client.query(UPDATE_QUOTATION_CONVERTED_QUERY, [
      createdOrder.rent_id,
      q_id
    ]);

    await client.query("COMMIT");
    return createdOrder;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
