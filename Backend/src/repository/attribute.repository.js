import { getPool } from "../config/database.js";
import {
  INSERT_ATTRIBUTE_QUERY,
  SELECT_ATTRIBUTE_BY_COMPANY_AND_NAME_QUERY,
  SELECT_ATTRIBUTES_BY_COMPANY_ID_QUERY,
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
  INSERT_PRODUCT_ATTRIBUTE_QUERY,
} from "../queries/attribute.query.js";

// ==========================================
// ATTRIBUTES
// ==========================================

export async function createAttribute(c_id, name) {
  const pool = getPool();
  const existing = await pool.query(SELECT_ATTRIBUTE_BY_COMPANY_AND_NAME_QUERY, [c_id, name.trim()]);
  if (existing.rows[0]) return existing.rows[0];
  const result = await pool.query(INSERT_ATTRIBUTE_QUERY, [c_id, name.trim()]);
  return result.rows[0];
}

export async function getAttributesByCompanyId(c_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_ATTRIBUTES_BY_COMPANY_ID_QUERY, [c_id]);
  return result.rows;
}

export async function updateAttribute(attri_id, name) {
  const pool = getPool();
  const result = await pool.query(UPDATE_ATTRIBUTE_QUERY, [name.trim(), attri_id]);
  return result.rows[0] || null;
}

export async function deleteAttribute(attri_id) {
  const pool = getPool();
  const result = await pool.query(DELETE_ATTRIBUTE_QUERY, [attri_id]);
  return result.rows[0] || null;
}

export async function createProductAttribute(p_id, attri_id) {
  const pool = getPool();
  const result = await pool.query(INSERT_PRODUCT_ATTRIBUTE_QUERY, [p_id, attri_id]);
  return result.rows[0];
}

// ==========================================
// ATTRIBUTE KEYS
// ==========================================

export async function createAttributeKey(attri_id, key_name) {
  const pool = getPool();
  const result = await pool.query(INSERT_ATTRIBUTE_KEY_QUERY, [attri_id, key_name.trim()]);
  return result.rows[0];
}

export async function getAttributeKeysByAttriId(attri_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_ATTRIBUTE_KEYS_BY_ATTRI_ID_QUERY, [attri_id]);
  return result.rows;
}

export async function updateAttributeKey(key_id, key_name) {
  const pool = getPool();
  const result = await pool.query(UPDATE_ATTRIBUTE_KEY_QUERY, [key_name.trim(), key_id]);
  return result.rows[0] || null;
}

export async function deleteAttributeKey(key_id) {
  const pool = getPool();
  const result = await pool.query(DELETE_ATTRIBUTE_KEY_QUERY, [key_id]);
  return result.rows[0] || null;
}

// ==========================================
// ATTRIBUTE VALUES
// ==========================================

export async function createAttributeValue(key_id, value_name) {
  const pool = getPool();
  const result = await pool.query(INSERT_ATTRIBUTE_VALUE_QUERY, [key_id, value_name.trim()]);
  return result.rows[0];
}

export async function getAttributeValuesByKeyId(key_id) {
  const pool = getPool();
  const result = await pool.query(SELECT_ATTRIBUTE_VALUES_BY_KEY_ID_QUERY, [key_id]);
  return result.rows;
}

export async function updateAttributeValue(value_id, value_name) {
  const pool = getPool();
  const result = await pool.query(UPDATE_ATTRIBUTE_VALUE_QUERY, [value_name.trim(), value_id]);
  return result.rows[0] || null;
}

export async function deleteAttributeValue(value_id) {
  const pool = getPool();
  const result = await pool.query(DELETE_ATTRIBUTE_VALUE_QUERY, [value_id]);
  return result.rows[0] || null;
}
