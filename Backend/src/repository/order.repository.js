import { getPool } from "../config/database.js";
import {
  INSERT_RENTING_ORDER_QUERY,
  SELECT_ALL_RENTING_ORDERS_QUERY,
  SELECT_RENTING_ORDER_BY_ID_QUERY,
  UPDATE_RENTING_ORDER_STATUS_QUERY,
  DELETE_RENTING_ORDER_QUERY,
  SELECT_ENRICHED_ORDERS_BY_COMPANY_QUERY,
  SELECT_RENTING_ORDERS_BY_USER_QUERY,
} from "../queries/order.query.js";
import { sendInvoiceEmail } from "../service/invoice-mail.service.js";

// ==========================================
// RENTING ORDERS
// ==========================================

export async function createRentingOrder(orderData) {
  const {
    r_id,
    asset_id,
    email,
    start_date,
    end_date,
    delivery_status,
    total,
    invoice_status,
    u_id,
    invoice_address_id,
    delivery_address_id,
  } = orderData;

  const pool = getPool();
  const result = await pool.query(INSERT_RENTING_ORDER_QUERY, [
    r_id,
    asset_id,
    email,
    start_date,
    end_date,
    delivery_status,
    total,
    invoice_status || "nothing_to_invoice",
    u_id || null,
    invoice_address_id || null,
    delivery_address_id || null,
  ]);
  return result.rows[0];
}

export async function getAllRentingOrders() {
  const pool = getPool();
  const result = await pool.query(SELECT_ALL_RENTING_ORDERS_QUERY);
  return result.rows;
}

export async function getRentingOrderById(rent_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_RENTING_ORDER_BY_ID_QUERY, [rent_id]);
  return result.rows[0] || null;
}

export async function updateRentingOrderStatus(rent_id, delivery_status) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get order details
    const orderDetailsRes = await client.query(
      `SELECT ro.rent_id, ro.delivery_status, ro.email, ro.start_date, ro.end_date, ro.total, ro.deposit_amount,
              a.p_id, p.pname,
              rp.price AS plan_price, rp.duration_type, rp.penalty,
              adr_inv.address_line1 AS inv_line1, adr_inv.address_line2 AS inv_line2, adr_inv.city AS inv_city, adr_inv.state AS inv_state, adr_inv.pincode AS inv_pincode,
              adr_del.address_line1 AS del_line1, adr_del.address_line2 AS del_line2, adr_del.city AS del_city, adr_del.state AS del_state, adr_del.pincode AS del_pincode
       FROM renting_orders ro
       JOIN assets a ON ro.asset_id = a.asset_id
       JOIN products p ON a.p_id = p.p_id
       JOIN rent_plans rp ON ro.r_id = rp.r_id
       LEFT JOIN addresses adr_inv ON ro.invoice_address_id = adr_inv.address_id
       LEFT JOIN addresses adr_del ON ro.delivery_address_id = adr_del.address_id
       WHERE ro.rent_id = $1`,
      [rent_id]
    );

    const order = orderDetailsRes.rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return null;
    }

    let updatedOrder;

    if (delivery_status === 'returned' && order.delivery_status !== 'returned') {
      // 1. Calculate late penalty
      const now = new Date();
      let calculated_penalty = 0;
      let lateUnits = 0;

      const msDiff = now - new Date(order.end_date);
      const penaltyRate = Number(order.penalty || 0);

      if (msDiff > 0) {
        switch (order.duration_type) {
          case "hourly":
            lateUnits = Math.ceil(msDiff / (1000 * 60 * 60));
            break;
          case "daily":
          case "nightly":
            lateUnits = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
            break;
          case "weekly":
            lateUnits = Math.ceil(msDiff / (1000 * 60 * 60 * 24 * 7));
            break;
          case "monthly":
            lateUnits = Math.ceil(msDiff / (1000 * 60 * 60 * 24 * 30));
            break;
          case "yearly":
            lateUnits = Math.ceil(msDiff / (1000 * 60 * 60 * 24 * 365));
            break;
        }
        calculated_penalty = lateUnits * penaltyRate;
      }

      // 2. Generate and email invoice
      const rentAmount = Number(order.total || 0);
      const depositAmount = Number(order.deposit_amount || 0);
      const lines = [
        {
          productName: `${order.pname} (Rental Charge)`,
          quantity: 1,
          unit: "Period",
          unitPrice: rentAmount,
          taxRate: 10,
          amount: rentAmount * 1.10
        }
      ];

      if (calculated_penalty > 0) {
        lines.push({
          productName: `Late Return Penalty (${lateUnits} delay ${order.duration_type === 'hourly' ? 'hour(s)' : 'day(s)'})`,
          quantity: 1,
          unit: "Period",
          unitPrice: calculated_penalty,
          taxRate: 10,
          amount: calculated_penalty * 1.10
        });
      }

      if (depositAmount > 0) {
        lines.push({
          productName: "Security Deposit (Deducted / Credit)",
          quantity: 1,
          unit: "Credit",
          unitPrice: -depositAmount,
          taxRate: 0,
          amount: -depositAmount
        });
      }

      const untaxedAmount = rentAmount + calculated_penalty - depositAmount;
      const taxes = (rentAmount + calculated_penalty) * 0.10;
      const totalAmount = untaxedAmount + taxes;

      const totalsObj = {
        untaxed: untaxedAmount,
        taxes: taxes,
        total: totalAmount
      };

      const formattedInvAddress = order.inv_line1 ? `${order.inv_line1}${order.inv_line2 ? ', ' + order.inv_line2 : ''}, ${order.inv_city}, ${order.inv_state} - ${order.inv_pincode}` : "Not selected";
      const formattedDelAddress = order.del_line1 ? `${order.del_line1}${order.del_line2 ? ', ' + order.del_line2 : ''}, ${order.del_city}, ${order.del_state} - ${order.del_pincode}` : "Not selected";

      try {
        await sendInvoiceEmail({
          to: order.email,
          invoiceNumber: `INV-${rent_id}-${Date.now().toString().slice(-4)}`,
          invoiceDate: new Date().toLocaleDateString("en-IN"),
          invoiceAddress: formattedInvAddress,
          deliveryAddress: formattedDelAddress,
          lines,
          totals: totalsObj
        });
      } catch (emailErr) {
        console.error("[Email] Return invoice email dispatch failed:", emailErr.message);
      }

      // 3. Update order in DB: set delivery_status = 'returned', invoice_status = 'invoiced', payment_status = 'paid'
      const updateRes = await client.query(
        `UPDATE renting_orders
         SET delivery_status = $1, invoice_status = 'invoiced', payment_status = 'paid'
         WHERE rent_id = $2
         RETURNING *`,
        [delivery_status, rent_id]
      );
      updatedOrder = updateRes.rows[0];

      // 4. Increment available product quantity by 1
      await client.query(
        `UPDATE products
         SET quantity = quantity + 1
         WHERE p_id = $1`,
        [order.p_id]
      );

    } else {
      // Standard status update
      const updateRes = await client.query(UPDATE_RENTING_ORDER_STATUS_QUERY, [delivery_status, rent_id]);
      updatedOrder = updateRes.rows[0];
    }

    await client.query("COMMIT");
    return updatedOrder;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteRentingOrder(rent_id) {
  const pool = getPool();
  const result = await pool.query(DELETE_RENTING_ORDER_QUERY, [rent_id]);
  return result.rows[0] || null;
}

// ==========================================
// ENRICHED ORDERS (Dashboard)
// Returns orders with product name, rent plan
// details, filtered by company ID
// ==========================================

export async function getAllEnrichedOrders(c_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_ENRICHED_ORDERS_BY_COMPANY_QUERY, [c_id]);
  
  const now = new Date();
  return result.rows.map((row) => {
    let calculated_penalty = 0;
    
    // An order is late if not returned/cancelled and current time is past end_date
    const isLate = 
      !["returned", "cancelled"].includes(row.delivery_status) && 
      new Date(row.end_date) < now;
      
    if (isLate) {
      const msDiff = now - new Date(row.end_date);
      let lateUnits = 0;
      const penaltyRate = Number(row.penalty || 0);

      switch (row.duration_type) {
        case "hourly":
          lateUnits = Math.ceil(msDiff / (1000 * 60 * 60));
          break;
        case "daily":
        case "nightly":
          lateUnits = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
          break;
        case "weekly":
          lateUnits = Math.ceil(msDiff / (1000 * 60 * 60 * 24 * 7));
          break;
        case "monthly":
          lateUnits = Math.ceil(msDiff / (1000 * 60 * 60 * 24 * 30));
          break;
        case "yearly":
          lateUnits = Math.ceil(msDiff / (1000 * 60 * 60 * 24 * 365));
          break;
        default:
          lateUnits = 0;
      }
      calculated_penalty = lateUnits * penaltyRate;
    }
    
    return {
      ...row,
      calculated_penalty,
    };
  });
}

export async function getRentingOrdersByUser(u_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_RENTING_ORDERS_BY_USER_QUERY, [u_id]);
  return result.rows;
}

