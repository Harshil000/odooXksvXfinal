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

export async function getAllProducts(limit = null, offset = 0) {
  const pool = getPool();
  let query = SELECT_ALL_PRODUCTS_QUERY.trim();
  if (query.endsWith(";")) {
    query = query.slice(0, -1);
  }
  
  const params = [];
  if (limit !== null) {
    query += ` LIMIT $1 OFFSET $2`;
    params.push(limit, offset);
  }
  query += ";";
  
  const result = await pool.query(query, params);
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
  
  // Fetch product quantity
  const prodRes = await pool.query("SELECT quantity FROM products WHERE p_id = $1", [p_id]);
  const quantity = prodRes.rows[0]?.quantity || 0;
  
  const result = await pool.query(SELECT_ASSETS_BY_PRODUCT_ID_QUERY, [p_id]);
  const currentAssets = result.rows;

  if (currentAssets.length > quantity) {
    const toDelete = currentAssets.slice(quantity).map(a => a.asset_id);
    await pool.query("DELETE FROM assets WHERE asset_id = ANY($1::uuid[])", [toDelete]);
    return currentAssets.slice(0, quantity);
  }
  
  return currentAssets;
}

export async function getProductVariants(pname, c_id) {
  const pool = getPool();
  const query = `
    SELECT p.p_id, p.c_id, p.pname, p.description, p.to_publish, p.quantity, p.product_type, p.sales_price, p.cost_price,
           (SELECT image_base64 FROM product_images i WHERE i.p_id = p.p_id LIMIT 1) as image
    FROM products p
    WHERE LOWER(p.pname) = LOWER($1) AND p.c_id = $2;
  `;
  const result = await pool.query(query, [pname, c_id]);
  return result.rows;
}

export async function getProductsAttributes(p_ids) {
  if (!p_ids || p_ids.length === 0) return [];
  const pool = getPool();
  const query = `
    SELECT pa.p_id, a.attri_id, a.name AS attribute_name, ak.key_id, ak.key_name, av.value_id, av.value_name
    FROM product_attributes pa
    JOIN attributes a ON pa.attri_id = a.attri_id
    LEFT JOIN attribute_keys ak ON a.attri_id = ak.attri_id
    LEFT JOIN attribute_values av ON ak.key_id = av.key_id
    WHERE pa.p_id = ANY($1);
  `;
  const result = await pool.query(query, [p_ids]);
  return result.rows;
}

