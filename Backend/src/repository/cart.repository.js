import crypto from "node:crypto";
import { getPool } from "../config/database.js";
import { resolveDatabaseMode } from "../database/dbMode.js";
import { initializeStore, getStore, saveStore } from "../database/fileStore.js";
import {
  INSERT_CART_ITEM_QUERY,
  SELECT_CART_ITEMS_BY_USER_QUERY,
  UPDATE_CART_ITEM_QUERY,
  DELETE_CART_ITEM_QUERY,
  CLEAR_CART_QUERY,
} from "../queries/cart.query.js";

// ==========================================
// CART REPOSITORY
// ==========================================

export async function addToCart(cartData) {
  const { u_id, p_id, r_id, quantity, start_date, end_date } = cartData;
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();

    // Check if the item already exists in the cart for this plan
    const existing = store.cart_items.find(
      (item) => item.u_id === u_id && item.p_id === p_id && item.r_id === r_id
    );

    if (existing) {
      existing.quantity += Number(quantity || 1);
      if (start_date) existing.start_date = start_date;
      if (end_date) existing.end_date = end_date;
      await saveStore();
      return existing;
    }

    const newItem = {
      cart_item_id: crypto.randomUUID(),
      u_id,
      p_id,
      r_id,
      quantity: Number(quantity || 1),
      start_date,
      end_date,
      created_at: new Date().toISOString(),
    };
    store.cart_items.push(newItem);
    await saveStore();
    return newItem;
  }

  const pool = getPool();
  // Check if existing first in pg to increment quantity
  const checkQuery = `SELECT * FROM cart_items WHERE u_id = $1 AND p_id = $2 AND r_id = $3 LIMIT 1;`;
  const existingResult = await pool.query(checkQuery, [u_id, p_id, r_id]);
  
  if (existingResult.rows.length > 0) {
    const existing = existingResult.rows[0];
    const newQty = existing.quantity + Number(quantity || 1);
    const updateResult = await pool.query(UPDATE_CART_ITEM_QUERY, [
      newQty,
      start_date || existing.start_date,
      end_date || existing.end_date,
      existing.cart_item_id,
    ]);
    return updateResult.rows[0];
  }

  const result = await pool.query(INSERT_CART_ITEM_QUERY, [
    u_id,
    p_id,
    r_id,
    quantity || 1,
    start_date || null,
    end_date || null,
  ]);
  return result.rows[0];
}

export async function getCartByUserId(u_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();

    return store.cart_items
      .filter((item) => item.u_id === u_id)
      .map((item) => {
        const product = store.products.find((p) => p.p_id === item.p_id);
        const plan = store.rent_plans.find((rp) => rp.r_id === item.r_id);
        if (!product || !plan) return null;

        const img = (store.product_images || []).find((i) => i.p_id === product.p_id);

        return {
          ...item,
          product_name: product.pname,
          sales_price: product.sales_price,
          cost_price: product.cost_price,
          plan_price: plan.price,
          duration_type: plan.duration_type,
          deposit: plan.deposit,
          image: img ? img.image_base64 : null,
        };
      })
      .filter(Boolean);
  }

  const pool = getPool();
  const result = await pool.query(SELECT_CART_ITEMS_BY_USER_QUERY, [u_id]);
  return result.rows;
}

export async function updateCartItem(cart_item_id, quantity, start_date, end_date) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const item = store.cart_items.find((i) => i.cart_item_id === cart_item_id);
    if (!item) return null;

    item.quantity = Number(quantity);
    if (start_date) item.start_date = start_date;
    if (end_date) item.end_date = end_date;
    await saveStore();
    return item;
  }

  const pool = getPool();
  const result = await pool.query(UPDATE_CART_ITEM_QUERY, [
    quantity,
    start_date || null,
    end_date || null,
    cart_item_id,
  ]);
  return result.rows[0] || null;
}

export async function deleteCartItem(cart_item_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const idx = store.cart_items.findIndex((i) => i.cart_item_id === cart_item_id);
    if (idx === -1) return null;

    const [deleted] = store.cart_items.splice(idx, 1);
    await saveStore();
    return deleted;
  }

  const pool = getPool();
  const result = await pool.query(DELETE_CART_ITEM_QUERY, [cart_item_id]);
  return result.rows[0] || null;
}

export async function clearCart(u_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    store.cart_items = store.cart_items.filter((item) => item.u_id !== u_id);
    await saveStore();
    return true;
  }

  const pool = getPool();
  await pool.query(CLEAR_CART_QUERY, [u_id]);
  return true;
}
