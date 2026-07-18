import { getPool } from "../config/database.js";
import { INSERT_PAYMENT_QUERY } from "../queries/payment.query.js";
import { createAddress } from "./address.repository.js";

const INSERT_ORDER_WITH_PAYMENT_QUERY = `
  INSERT INTO renting_orders (
    r_id, asset_id, u_id, invoice_address_id, delivery_address_id, email,
    start_date, end_date, delivery_status, invoice_status, total,
    payment_status, deposit_amount, deposit_refunded_amount
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
`;

const DELETE_USER_CART_QUERY = `
  DELETE FROM cart_items
  WHERE u_id = $1;
`;

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

/**
 * Saves the entire checkout transaction inside a single SQL Transaction block.
 * Inserts address, creates renting orders, registers payment audits, and clears the user's cart.
 */
export async function saveCheckoutTransaction({
  u_id,
  email,
  address,
  cartItems,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  method,
}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create billing/delivery address
    let addressId = null;
    if (address && address.address_line1) {
      const addrRes = await client.query(
        `INSERT INTO addresses (pincode, state, city, address_line1, address_line2, u_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING address_id;`,
        [
          address.pincode || "",
          address.state || "",
          address.city || "",
          address.address_line1,
          address.address_line2 || null,
          u_id,
        ]
      );
      addressId = addrRes.rows[0].address_id;
    }

    const createdOrders = [];

    // 2. Loop and create renting orders & payments
    for (const item of cartItems) {
      const asset_id = await findOrCreateFreeAsset(item.p_id, item.startDate, item.endDate, client);

      const rentalTotal = Number(item.subtotal || 0);
      const depositAmount = Number(item.deposit || 0);
      const totalAmount = rentalTotal + depositAmount;

      // 2.1 Insert Renting Order
      const orderRes = await client.query(INSERT_ORDER_WITH_PAYMENT_QUERY, [
        item.r_id,
        asset_id,
        u_id,
        addressId, // invoice_address_id
        addressId, // delivery_address_id
        email,
        item.startDate,
        item.endDate,
        "pending", // delivery_status
        "nothing_to_invoice", // invoice_status
        rentalTotal, // total (rent charge only)
        "paid", // payment_status
        depositAmount, // deposit_amount
        0, // deposit_refunded_amount
      ]);

      const order = orderRes.rows[0];
      createdOrders.push(order);

      // 2.2 Insert Rent Payment (Audit Trail)
      if (rentalTotal > 0) {
        await client.query(INSERT_PAYMENT_QUERY, [
          order.rent_id,
          u_id,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          rentalTotal,
          "INR",
          false, // is_deposit
          "captured", // status
          method || "card",
        ]);
      }

      // 2.3 Insert Deposit Payment (Audit Trail)
      if (depositAmount > 0) {
        await client.query(INSERT_PAYMENT_QUERY, [
          order.rent_id,
          u_id,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          depositAmount,
          "INR",
          true, // is_deposit
          "captured", // status
          method || "card",
        ]);
      }
    }

    // 3. Clear customer cart
    await client.query(DELETE_USER_CART_QUERY, [u_id]);

    await client.query("COMMIT");
    return createdOrders;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
