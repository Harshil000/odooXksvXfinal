import { getPool } from "../config/database.js";
import {
  INSERT_RENTING_ORDER_QUERY,
  SELECT_ALL_RENTING_ORDERS_QUERY,
  SELECT_RENTING_ORDER_BY_ID_QUERY,
  UPDATE_RENTING_ORDER_STATUS_QUERY,
  DELETE_RENTING_ORDER_QUERY,
  SELECT_ENRICHED_ORDERS_BY_COMPANY_QUERY,
} from "../queries/order.query.js";

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
  const result = await pool.query(UPDATE_RENTING_ORDER_STATUS_QUERY, [delivery_status, rent_id]);
  return result.rows[0] || null;
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

