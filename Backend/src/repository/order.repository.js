import { getPool } from "../config/database.js";
import {
  INSERT_RENTING_ORDER_QUERY,
  SELECT_ALL_RENTING_ORDERS_QUERY,
  SELECT_RENTING_ORDER_BY_ID_QUERY,
  UPDATE_RENTING_ORDER_STATUS_QUERY,
  DELETE_RENTING_ORDER_QUERY,
} from "../queries/order.query.js";

// ==========================================
// RENTING ORDERS
// ==========================================

export async function createRentingOrder(orderData) {
  const { r_id, asset_id, email, start_date, end_date, delivery_status, total } = orderData;

  const pool = getPool();
  const result = await pool.query(INSERT_RENTING_ORDER_QUERY, [
    r_id,
    asset_id,
    email,
    start_date,
    end_date,
    delivery_status,
    total,
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
