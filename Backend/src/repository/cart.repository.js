import { getPool } from "../config/database.js";
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
  const pool = getPool();
  const result = await pool.query(SELECT_CART_ITEMS_BY_USER_QUERY, [u_id]);
  return result.rows;
}

export async function updateCartItem(cart_item_id, quantity, start_date, end_date) {
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
  const pool = getPool();
  const result = await pool.query(DELETE_CART_ITEM_QUERY, [cart_item_id]);
  return result.rows[0] || null;
}

export async function clearCart(u_id) {
  const pool = getPool();
  await pool.query(CLEAR_CART_QUERY, [u_id]);
  return true;
}
