import { getPool } from "../config/database.js";
import {
  INSERT_PRODUCT_QUERY,
  SELECT_ALL_PRODUCTS_QUERY,
  SELECT_PRODUCT_BY_ID_QUERY,
  UPDATE_PRODUCT_QUERY,
  DELETE_PRODUCT_QUERY,
  INSERT_PRODUCT_IMAGE_QUERY,
  SELECT_IMAGES_BY_PRODUCT_ID_QUERY,
  DELETE_PRODUCT_IMAGE_QUERY,
  INSERT_ASSET_QUERY,
  SELECT_ASSETS_BY_PRODUCT_ID_QUERY,
} from "../queries/product.query.js";

// ==========================================
// PRODUCTS
// ==========================================

export async function createProduct(c_id, productData) {
  const { pname, description, to_publish, quantity, product_type, sales_price, cost_price } = productData;

  const pool = getPool();
  const result = await pool.query(INSERT_PRODUCT_QUERY, [
    c_id,
    pname.trim(),
    description ? description.trim() : null,
    to_publish || false,
    quantity || 0,
    product_type || 'Goods',
    sales_price || 0,
    cost_price || 0,
  ]);
  return result.rows[0];
}

export async function getAllProducts() {
  const pool = getPool();
  const result = await pool.query(SELECT_ALL_PRODUCTS_QUERY);
  return result.rows;
}

export async function getProductById(p_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_PRODUCT_BY_ID_QUERY, [p_id]);
  return result.rows[0] || null;
}

export async function updateProduct(p_id, productData) {
  const { pname, description, to_publish, quantity, product_type, sales_price, cost_price } = productData;

  const pool = getPool();
  const result = await pool.query(UPDATE_PRODUCT_QUERY, [
    pname.trim(),
    description ? description.trim() : null,
    to_publish,
    quantity,
    product_type,
    sales_price,
    cost_price,
    p_id,
  ]);
  return result.rows[0] || null;
}

export async function deleteProduct(p_id) {
  const pool = getPool();
  const result = await pool.query(DELETE_PRODUCT_QUERY, [p_id]);
  return result.rows[0] || null;
}

// ==========================================
// PRODUCT IMAGES
// ==========================================

export async function createProductImage(p_id, image_base64) {
  const pool = getPool();
  const result = await pool.query(INSERT_PRODUCT_IMAGE_QUERY, [p_id, image_base64]);
  return result.rows[0];
}

export async function getImagesByProductId(p_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_IMAGES_BY_PRODUCT_ID_QUERY, [p_id]);
  return result.rows;
}

export async function deleteProductImage(img_id) {
  const pool = getPool();
  const result = await pool.query(DELETE_PRODUCT_IMAGE_QUERY, [img_id]);
  return result.rows[0] || null;
}

// ==========================================
// ASSETS
// ==========================================

export async function createAsset(p_id, qr) {
  const pool = getPool();
  const result = await pool.query(INSERT_ASSET_QUERY, [p_id, qr]);
  return result.rows[0];
}

export async function getAssetsByProductId(p_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_ASSETS_BY_PRODUCT_ID_QUERY, [p_id]);
  return result.rows;
}
