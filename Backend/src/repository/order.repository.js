import { getPool } from "../config/database.js";
import { resolveDatabaseMode } from "../database/dbMode.js";
import { initializeStore, getStore, saveStore } from "../database/fileStore.js";
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
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const newOrder = {
      rent_id: store.renting_orders.length + 1, // Using integer ID for bigserial
      r_id,
      asset_id,
      email,
      start_date,
      end_date,
      delivery_status,
      total: Number(total),
    };
    store.renting_orders.push(newOrder);
    await saveStore();
    return newOrder;
  }

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
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    return getStore().renting_orders;
  }

  const pool = getPool();
  const result = await pool.query(SELECT_ALL_RENTING_ORDERS_QUERY);
  return result.rows;
}

export async function getRentingOrderById(rent_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    // Using == instead of === because rent_id from params is a string
    return getStore().renting_orders.find(o => o.rent_id == rent_id) || null;
  }

  const pool = getPool();
  const result = await pool.query(SELECT_RENTING_ORDER_BY_ID_QUERY, [rent_id]);
  return result.rows[0] || null;
}

export async function updateRentingOrderStatus(rent_id, delivery_status) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const order = store.renting_orders.find(o => o.rent_id == rent_id);
    if (!order) return null;

    order.delivery_status = delivery_status;
    await saveStore();
    return order;
  }

  const pool = getPool();
  const result = await pool.query(UPDATE_RENTING_ORDER_STATUS_QUERY, [delivery_status, rent_id]);
  return result.rows[0] || null;
}

export async function deleteRentingOrder(rent_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const idx = store.renting_orders.findIndex(o => o.rent_id == rent_id);
    if (idx === -1) return null;

    const [deleted] = store.renting_orders.splice(idx, 1);
    await saveStore();
    return deleted;
  }

  const pool = getPool();
  const result = await pool.query(DELETE_RENTING_ORDER_QUERY, [rent_id]);
  return result.rows[0] || null;
}
