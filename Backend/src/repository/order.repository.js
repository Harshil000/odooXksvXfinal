import { getPool } from "../config/database.js";
import { resolveDatabaseMode } from "../database/dbMode.js";
import { initializeStore, getStore, saveStore } from "../database/fileStore.js";
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
  const { r_id, asset_id, email, start_date, end_date, delivery_status, total, invoice_status } = orderData;
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
      invoice_status: invoice_status || "nothing_to_invoice",
      created_at: new Date().toISOString(),
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
    invoice_status || "nothing_to_invoice",
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

// ==========================================
// ENRICHED ORDERS (Dashboard)
// Returns orders with product name, rent plan
// details, filtered by company ID
// ==========================================

export async function getAllEnrichedOrders(c_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();

    // Manual JOIN in file mode
    return store.renting_orders
      .map((order) => {
        const rentPlan = store.rent_plans.find(rp => rp.r_id === order.r_id);
        if (!rentPlan) return null;

        const product = store.products.find(p => p.p_id === rentPlan.p_id);
        if (!product || product.c_id !== c_id) return null;

        return {
          rent_id: order.rent_id,
          r_id: order.r_id,
          asset_id: order.asset_id,
          customer_email: order.email,
          start_date: order.start_date,
          end_date: order.end_date,
          delivery_status: order.delivery_status,
          invoice_status: order.invoice_status || "nothing_to_invoice",
          total: order.total,
          created_at: order.created_at,
          deposit: rentPlan.deposit,
          penalty: rentPlan.penalty,
          plan_price: rentPlan.price,
          duration_type: rentPlan.duration_type,
          pickup_time: rentPlan.pickup_time,
          return_time: rentPlan.return_time,
          product_name: product.pname,
          p_id: product.p_id,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const pool = getPool();
  const result = await pool.query(SELECT_ENRICHED_ORDERS_BY_COMPANY_QUERY, [c_id]);
  return result.rows;
}

