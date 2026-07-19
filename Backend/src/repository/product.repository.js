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

export async function getAllProducts(limit = null, offset = 0, onlyAvailable = false) {
  const pool = getPool();
  let query = `
    SELECT p.p_id, p.c_id, p.pname, p.description, p.to_publish, p.quantity, p.product_type, p.sales_price, p.cost_price,
           (SELECT image_base64 FROM product_images i WHERE i.p_id = p.p_id LIMIT 1) as image,
           (SELECT COUNT(*)::int FROM assets a WHERE a.p_id = p.p_id) as asset_count,
           (SELECT COUNT(*)::int 
              FROM assets a 
              JOIN renting_orders ro ON ro.asset_id = a.asset_id 
             WHERE a.p_id = p.p_id 
               AND ro.delivery_status NOT IN ('returned', 'cancelled')
           ) as rented_count
    FROM products p
  `;
  
  if (onlyAvailable) {
    query += ` WHERE p.quantity > 0`;
  }
  
  const params = [];
  if (limit !== null) {
    if (onlyAvailable) {
      query += ` LIMIT $1 OFFSET $2`;
    } else {
      query += ` LIMIT $1 OFFSET $2`;
    }
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

export async function syncProductAssets(p_id) {
  const pool = getPool();
  
  // 1. Fetch product quantity and name
  const prodRes = await pool.query("SELECT quantity, pname FROM products WHERE p_id = $1", [p_id]);
  if (!prodRes.rows[0]) return;
  const { quantity, pname } = prodRes.rows[0];
  
  // 2. Fetch current assets (ordered by asset_id or order of creation)
  const assetsRes = await pool.query("SELECT asset_id, qr FROM assets WHERE p_id = $1 ORDER BY asset_id", [p_id]);
  const currentAssets = assetsRes.rows;
  
  if (currentAssets.length > quantity) {
    // Delete excess assets
    const toDelete = currentAssets.slice(quantity).map(a => a.asset_id);
    await pool.query("DELETE FROM assets WHERE asset_id = ANY($1::uuid[])", [toDelete]);
  } else if (currentAssets.length < quantity) {
    // Create missing assets
    const missingCount = quantity - currentAssets.length;
    for (let i = 0; i < missingCount; i++) {
      const sequence = currentAssets.length + i + 1;
      const paddedSequence = String(sequence).padStart(6, '0');
      const pidPrefix = p_id.slice(0, 8).toUpperCase();
      const pnamePrefix = pname.slice(0, 4).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const qr = `PRD-${pidPrefix}-${pnamePrefix}-${paddedSequence}`;
      await pool.query(INSERT_ASSET_QUERY, [p_id, qr]);
    }
  }
}

export async function getAssetsByProductId(p_id) {
  const pool = getPool();
  await syncProductAssets(p_id);
  const result = await pool.query(SELECT_ASSETS_BY_PRODUCT_ID_QUERY, [p_id]);
  return result.rows;
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

