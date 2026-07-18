import crypto from "node:crypto";
import { getPool } from "../config/database.js";
import { resolveDatabaseMode } from "../database/dbMode.js";
import { initializeStore, getStore, saveStore } from "../database/fileStore.js";
import {
  INSERT_ATTRIBUTE_QUERY,
  SELECT_ATTRIBUTES_BY_PRODUCT_ID_QUERY,
  UPDATE_ATTRIBUTE_QUERY,
  DELETE_ATTRIBUTE_QUERY,
  INSERT_ATTRIBUTE_KEY_QUERY,
  SELECT_ATTRIBUTE_KEYS_BY_ATTRI_ID_QUERY,
  UPDATE_ATTRIBUTE_KEY_QUERY,
  DELETE_ATTRIBUTE_KEY_QUERY,
  INSERT_ATTRIBUTE_VALUE_QUERY,
  SELECT_ATTRIBUTE_VALUES_BY_KEY_ID_QUERY,
  UPDATE_ATTRIBUTE_VALUE_QUERY,
  DELETE_ATTRIBUTE_VALUE_QUERY,
} from "../queries/attribute.query.js";

// ==========================================
// ATTRIBUTES
// ==========================================

export async function createAttribute(p_id, name) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const newAttri = { attri_id: crypto.randomUUID(), p_id, name: name.trim() };
    store.attributes.push(newAttri);
    await saveStore();
    return newAttri;
  }
  const pool = getPool();
  const result = await pool.query(INSERT_ATTRIBUTE_QUERY, [p_id, name.trim()]);
  return result.rows[0];
}

export async function getAttributesByProductId(p_id) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    return getStore().attributes.filter(a => a.p_id === p_id);
  }
  const pool = getPool();
  const result = await pool.query(SELECT_ATTRIBUTES_BY_PRODUCT_ID_QUERY, [p_id]);
  return result.rows;
}

export async function updateAttribute(attri_id, name) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const attr = store.attributes.find(a => a.attri_id === attri_id);
    if (!attr) return null;
    attr.name = name.trim();
    await saveStore();
    return attr;
  }
  const pool = getPool();
  const result = await pool.query(UPDATE_ATTRIBUTE_QUERY, [name.trim(), attri_id]);
  return result.rows[0] || null;
}

export async function deleteAttribute(attri_id) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const idx = store.attributes.findIndex(a => a.attri_id === attri_id);
    if (idx === -1) return null;
    const [deleted] = store.attributes.splice(idx, 1);
    await saveStore();
    return deleted;
  }
  const pool = getPool();
  const result = await pool.query(DELETE_ATTRIBUTE_QUERY, [attri_id]);
  return result.rows[0] || null;
}

// ==========================================
// ATTRIBUTE KEYS
// ==========================================

export async function createAttributeKey(attri_id, key_name) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const newKey = { key_id: crypto.randomUUID(), attri_id, key_name: key_name.trim() };
    store.attribute_keys.push(newKey);
    await saveStore();
    return newKey;
  }
  const pool = getPool();
  const result = await pool.query(INSERT_ATTRIBUTE_KEY_QUERY, [attri_id, key_name.trim()]);
  return result.rows[0];
}

export async function getAttributeKeysByAttriId(attri_id) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    return getStore().attribute_keys.filter(k => k.attri_id === attri_id);
  }
  const pool = getPool();
  const result = await pool.query(SELECT_ATTRIBUTE_KEYS_BY_ATTRI_ID_QUERY, [attri_id]);
  return result.rows;
}

export async function updateAttributeKey(key_id, key_name) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const key = store.attribute_keys.find(k => k.key_id === key_id);
    if (!key) return null;
    key.key_name = key_name.trim();
    await saveStore();
    return key;
  }
  const pool = getPool();
  const result = await pool.query(UPDATE_ATTRIBUTE_KEY_QUERY, [key_name.trim(), key_id]);
  return result.rows[0] || null;
}

export async function deleteAttributeKey(key_id) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const idx = store.attribute_keys.findIndex(k => k.key_id === key_id);
    if (idx === -1) return null;
    const [deleted] = store.attribute_keys.splice(idx, 1);
    await saveStore();
    return deleted;
  }
  const pool = getPool();
  const result = await pool.query(DELETE_ATTRIBUTE_KEY_QUERY, [key_id]);
  return result.rows[0] || null;
}

// ==========================================
// ATTRIBUTE VALUES
// ==========================================

export async function createAttributeValue(key_id, value_name) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const newVal = { value_id: crypto.randomUUID(), key_id, value_name: value_name.trim() };
    store.attribute_values.push(newVal);
    await saveStore();
    return newVal;
  }
  const pool = getPool();
  const result = await pool.query(INSERT_ATTRIBUTE_VALUE_QUERY, [key_id, value_name.trim()]);
  return result.rows[0];
}

export async function getAttributeValuesByKeyId(key_id) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    return getStore().attribute_values.filter(v => v.key_id === key_id);
  }
  const pool = getPool();
  const result = await pool.query(SELECT_ATTRIBUTE_VALUES_BY_KEY_ID_QUERY, [key_id]);
  return result.rows;
}

export async function updateAttributeValue(value_id, value_name) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const val = store.attribute_values.find(v => v.value_id === value_id);
    if (!val) return null;
    val.value_name = value_name.trim();
    await saveStore();
    return val;
  }
  const pool = getPool();
  const result = await pool.query(UPDATE_ATTRIBUTE_VALUE_QUERY, [value_name.trim(), value_id]);
  return result.rows[0] || null;
}

export async function deleteAttributeValue(value_id) {
  const mode = resolveDatabaseMode();
  if (mode === "file") {
    await initializeStore();
    const store = getStore();
    const idx = store.attribute_values.findIndex(v => v.value_id === value_id);
    if (idx === -1) return null;
    const [deleted] = store.attribute_values.splice(idx, 1);
    await saveStore();
    return deleted;
  }
  const pool = getPool();
  const result = await pool.query(DELETE_ATTRIBUTE_VALUE_QUERY, [value_id]);
  return result.rows[0] || null;
}
