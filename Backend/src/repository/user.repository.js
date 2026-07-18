import argon2 from "argon2";
import { getPool } from "../config/database.js";
import {
  INSERT_USER_QUERY,
  SELECT_USER_BY_EMAIL_QUERY,
  SELECT_USER_BY_ID_QUERY,
  INSERT_COMPANY_QUERY,
  SELECT_COMPANY_BY_ID_QUERY,
  UPDATE_USER_PROFILE_QUERY,
  UPDATE_COMPANY_PROFILE_QUERY,
} from "../queries/user.query.js";

// ========================
// USERS
// ========================

export async function createUser({ first_name, last_name, profile_image, email, password }) {
  const passwordHash = await argon2.hash(password);

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

    const result = await pool.query(INSERT_USER_QUERY, [
      String(first_name || "").trim(),
      String(last_name || "").trim(),
      profile_image || null,
      email.trim().toLowerCase(),
      passwordHash,
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

export async function findUserByEmail(email) {
  const pool = getPool();
  const result = await pool.query(SELECT_USER_BY_EMAIL_QUERY, [email]);
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const pool = getPool();
  const result = await pool.query(SELECT_USER_BY_ID_QUERY, [id]);
  return result.rows[0] || null;
}

export async function updateUserProfile(u_id, { first_name, last_name, profile_image }) {
  const pool = getPool();
  const result = await pool.query(UPDATE_USER_PROFILE_QUERY, [first_name, last_name, profile_image, u_id]);
  return result.rows[0];
}

// ========================
// COMPANIES
// ========================

export async function createCompany(companyData) {
  const { product_category, comp_prof_image, gst_no, cname, pincode, city, state, address_line1, address_line2 } = companyData;

  const pool = getPool();
  try {
    const result = await pool.query(INSERT_COMPANY_QUERY, [
      product_category,
      comp_prof_image || null,
      gst_no,
      cname,
      pincode,
      city,
      state,
      address_line1,
      address_line2 || null
    ]);
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") { // unique_violation for gst_no
      const err = new Error("Company with this GST number already exists");
      err.status = 409;
      throw err;
    }
    throw error;
  }
}

export async function findCompanyById(id) {
  const pool = getPool();
  const result = await pool.query(SELECT_COMPANY_BY_ID_QUERY, [id]);
  return result.rows[0] || null;
}

export async function updateCompanyProfile(c_id, data) {
  const pool = getPool();
  const result = await pool.query(UPDATE_COMPANY_PROFILE_QUERY, [
    data.cname,
    data.product_category,
    data.gst_no,
    data.pincode,
    data.city,
    data.state,
    data.address_line1,
    data.address_line2 || null,
    data.comp_prof_image || null,
    c_id
  ]);
  return result.rows[0];
}

export async function updateUserPassword(u_id, newPassword) {
  const passwordHash = await argon2.hash(newPassword);

  const pool = getPool();
  const query = `
    UPDATE users 
    SET password = $1
    WHERE u_id = $2
    RETURNING u_id, first_name, last_name, email;
  `;
  const result = await pool.query(query, [passwordHash, u_id]);
  return result.rows[0];
}
