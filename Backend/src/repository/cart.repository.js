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

  // Enforce stock check
  const productRes = await pool.query("SELECT quantity, pname FROM products WHERE p_id = $1;", [p_id]);
  const product = productRes.rows[0];
  if (!product) {
    throw new Error("Product not found");
  }
  const availableQty = Number(product.quantity || 0);

  // Sum up all quantities of this product currently in the user's cart (across all plans)
  const userCartItemsRes = await pool.query(
    "SELECT COALESCE(SUM(quantity), 0) as total_qty FROM cart_items WHERE u_id = $1 AND p_id = $2;", 
    [u_id, p_id]
  );
  const currentCartQty = Number(userCartItemsRes.rows[0].total_qty || 0);
  const addedQty = Number(quantity || 1);

  if (currentCartQty + addedQty > availableQty) {
    throw new Error(
      `Cannot add to cart. Only ${availableQty} items available in stock, and you already have ${currentCartQty} in cart.`
    );
  }

  // Check if existing first in pg to increment quantity
  const checkQuery = `SELECT * FROM cart_items WHERE u_id = $1 AND p_id = $2 AND r_id = $3 LIMIT 1;`;
  const existingResult = await pool.query(checkQuery, [u_id, p_id, r_id]);
  
  if (existingResult.rows.length > 0) {
    const existing = existingResult.rows[0];
    const newQty = existing.quantity + addedQty;
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
    addedQty,
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

  const cartItemRes = await pool.query("SELECT * FROM cart_items WHERE cart_item_id = $1;", [cart_item_id]);
  const cartItem = cartItemRes.rows[0];
  if (!cartItem) {
    return null;
  }
  const { p_id, u_id } = cartItem;

  const productRes = await pool.query("SELECT quantity FROM products WHERE p_id = $1;", [p_id]);
  const product = productRes.rows[0];
  if (!product) {
    throw new Error("Product not found");
  }
  const availableQty = Number(product.quantity || 0);

  const userCartItemsRes = await pool.query(
    "SELECT COALESCE(SUM(quantity), 0) as total_qty FROM cart_items WHERE u_id = $1 AND p_id = $2 AND cart_item_id != $3;", 
    [u_id, p_id, cart_item_id]
  );
  const otherCartQty = Number(userCartItemsRes.rows[0].total_qty || 0);
  const newQty = Number(quantity);

  if (otherCartQty + newQty > availableQty) {
    throw new Error(
      `Cannot update quantity. Only ${availableQty} items available in stock, and you have ${otherCartQty} other items of this product in cart.`
    );
  }

  const result = await pool.query(UPDATE_CART_ITEM_QUERY, [
    newQty,
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
