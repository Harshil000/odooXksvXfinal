import argon2 from "argon2";
import { getPool } from "../config/database.js";
import {
  INSERT_VENDOR_QUERY,
  SELECT_VENDOR_BY_EMAIL_QUERY,
  SELECT_VENDOR_BY_ID_QUERY,
  UPDATE_VENDOR_PROFILE_QUERY,
} from "../queries/user.query.js";

// ========================
// VENDORS
// ========================

export async function createVendor({ first_name, last_name, profile_image, email, password, c_id, role }) {
  const passwordHash = await argon2.hash(password);
  const vendorRole = role === "admin" ? "admin" : "vendor";

  const pool = getPool();
  try {
    const checkQuery = `
      SELECT email FROM users WHERE LOWER(email) = LOWER($1)
      UNION ALL
      SELECT email FROM vendors WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const checkResult = await pool.query(checkQuery, [email.trim()]);
    if (checkResult.rows.length > 0) {
      const err = new Error("Email already exists");
      err.status = 409;
      throw err;
    }

    const result = await pool.query(INSERT_VENDOR_QUERY, [
      String(first_name || "").trim(),
      String(last_name || "").trim(),
      profile_image || null,
      email.trim().toLowerCase(),
      passwordHash,
      c_id,
      vendorRole,
    ]);
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") { // unique_violation
      const err = new Error("Email already exists");
      err.status = 409;
      throw err;
    }
    throw error;
  }
}

export async function findVendorByEmail(email) {
  const pool = getPool();
  const result = await pool.query(SELECT_VENDOR_BY_EMAIL_QUERY, [email]);
  return result.rows[0] || null;
}

export async function findVendorById(id) {
  const pool = getPool();
  const result = await pool.query(SELECT_VENDOR_BY_ID_QUERY, [id]);
  return result.rows[0] || null;
}

export async function updateVendorProfile(v_id, { first_name, last_name, profile_image }) {
  const pool = getPool();
  const result = await pool.query(UPDATE_VENDOR_PROFILE_QUERY, [first_name, last_name, profile_image, v_id]);
  return result.rows[0];
}

export async function updateVendorPassword(v_id, newPassword) {
  const passwordHash = await argon2.hash(newPassword);

  const pool = getPool();
  const query = `
    UPDATE vendors
    SET password = $1
    WHERE v_id = $2
    RETURNING v_id, first_name, last_name, email, c_id, role;
  `;
  const result = await pool.query(query, [passwordHash, v_id]);
  return result.rows[0];
}
