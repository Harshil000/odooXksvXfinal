import argon2 from "argon2";
import { getPool } from "../config/database.js";
import {
  INSERT_VENDOR_QUERY,
  SELECT_VENDOR_BY_EMAIL_QUERY,
  SELECT_VENDOR_BY_ID_QUERY,
} from "../queries/user.query.js";

// ========================
// VENDORS
// ========================

export async function createVendor({ first_name, last_name, profile_image, email, password, c_id, role }) {
  const passwordHash = await argon2.hash(password);
  const vendorRole = role === "admin" ? "admin" : "vendor";

  const pool = getPool();
  try {
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
