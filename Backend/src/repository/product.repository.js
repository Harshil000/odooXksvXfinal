import crypto from "node:crypto";
import { getPool } from "../config/database.js";
import { resolveDatabaseMode } from "../database/dbMode.js";
import { initializeStore, getStore, saveStore } from "../database/fileStore.js";
import {
  INSERT_PRODUCT_QUERY,
  SELECT_ALL_PRODUCTS_QUERY,
  SELECT_PRODUCT_BY_ID_QUERY,
  UPDATE_PRODUCT_QUERY,
  DELETE_PRODUCT_QUERY,
  INSERT_PRODUCT_IMAGE_QUERY,
  SELECT_IMAGES_BY_PRODUCT_ID_QUERY,
  DELETE_PRODUCT_IMAGE_QUERY,
} from "../queries/product.query.js";

// ==========================================
// PRODUCTS
// ==========================================

export async function createProduct(c_id, productData) {
  const { pname, description, to_publish, quantity, product_type, sales_price, cost_price } = productData;
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const newProduct = {
      p_id: crypto.randomUUID(),
      c_id,
      pname: pname.trim(),
      description: description ? description.trim() : null,
      to_publish: to_publish || false,
      quantity: quantity || 0,
      product_type: product_type || 'Goods',
      sales_price: Number(sales_price || 0),
      cost_price: Number(cost_price || 0),
    };
    store.products.push(newProduct);
    await saveStore();
    return newProduct;
  }

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
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    return store.products.map(p => {
      const img = (store.product_images || []).find(i => i.p_id === p.p_id);
      return { ...p, image: img ? img.image_base64 : null };
    });
  }

  const pool = getPool();
  const result = await pool.query(SELECT_ALL_PRODUCTS_QUERY);
  return result.rows;
}

export async function getProductById(p_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    return getStore().products.find(p => p.p_id === p_id) || null;
  }

  const pool = getPool();
  const result = await pool.query(SELECT_PRODUCT_BY_ID_QUERY, [p_id]);
  return result.rows[0] || null;
}

export async function updateProduct(p_id, productData) {
  const { pname, description, to_publish, quantity, product_type, sales_price, cost_price } = productData;
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const product = store.products.find(p => p.p_id === p_id);
    if (!product) return null;

    product.pname = pname.trim();
    product.description = description ? description.trim() : null;
    if (to_publish !== undefined) product.to_publish = to_publish;
    if (quantity !== undefined) product.quantity = quantity;
    if (product_type !== undefined) product.product_type = product_type;
    if (sales_price !== undefined) product.sales_price = Number(sales_price);
    if (cost_price !== undefined) product.cost_price = Number(cost_price);

    await saveStore();
    return product;
  }

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
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const idx = store.products.findIndex(p => p.p_id === p_id);
    if (idx === -1) return null;

    const [deleted] = store.products.splice(idx, 1);
    
    // Cascade delete images
    store.product_images = store.product_images.filter(img => img.p_id !== p_id);
    
    await saveStore();
    return deleted;
  }

  const pool = getPool();
  const result = await pool.query(DELETE_PRODUCT_QUERY, [p_id]);
  return result.rows[0] || null;
}

// ==========================================
// PRODUCT IMAGES
// ==========================================

export async function createProductImage(p_id, image_base64) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const newImage = {
      img_id: crypto.randomUUID(),
      p_id,
      image_base64,
    };
    store.product_images.push(newImage);
    await saveStore();
    return newImage;
  }

  const pool = getPool();
  const result = await pool.query(INSERT_PRODUCT_IMAGE_QUERY, [p_id, image_base64]);
  return result.rows[0];
}

export async function getImagesByProductId(p_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    return getStore().product_images.filter(img => img.p_id === p_id);
  }

  const pool = getPool();
  const result = await pool.query(SELECT_IMAGES_BY_PRODUCT_ID_QUERY, [p_id]);
  return result.rows;
}

export async function deleteProductImage(img_id) {
  const mode = resolveDatabaseMode();

  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const idx = store.product_images.findIndex(img => img.img_id === img_id);
    if (idx === -1) return null;

    const [deleted] = store.product_images.splice(idx, 1);
    await saveStore();
    return deleted;
  }

  const pool = getPool();
  const result = await pool.query(DELETE_PRODUCT_IMAGE_QUERY, [img_id]);
  return result.rows[0] || null;
}
