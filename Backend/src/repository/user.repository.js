import argon2 from "argon2";
import { getPool } from "../config/database.js";
import { resolveDatabaseMode } from "../database/dbMode.js";
import {
  createUserRecord,
  findUserByEmail as findUserByEmailFromStore,
  findUserById as findUserByIdFromStore,
  createCompanyRecord,
  findCompanyById as findCompanyByIdFromStore,
} from "../database/fileStore.js";
import {
  INSERT_USER_QUERY,
  SELECT_USER_BY_EMAIL_QUERY,
  SELECT_USER_BY_ID_QUERY,
  INSERT_COMPANY_QUERY,
  SELECT_COMPANY_BY_ID_QUERY,
} from "../queries/user.query.js";

// ========================
// USERS
// ========================

export async function createUser({ first_name, last_name, profile_image, email, password }) {
  const mode = resolveDatabaseMode();
  const passwordHash = await argon2.hash(password);

  if (mode === "file") {
    const createdUser = await createUserRecord({
      first_name,
      last_name,
      profile_image,
      email,
      password_hash: passwordHash,
    });
    return createdUser;
  }

  const pool = getPool();
  try {
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
  const mode = resolveDatabaseMode();
  if (mode === "file") return findUserByEmailFromStore(email);
  
  const pool = getPool();
  const result = await pool.query(SELECT_USER_BY_EMAIL_QUERY, [email]);
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const mode = resolveDatabaseMode();
  if (mode === "file") return findUserByIdFromStore(id);
  
  const pool = getPool();
  const result = await pool.query(SELECT_USER_BY_ID_QUERY, [id]);
  return result.rows[0] || null;
}

// ========================
// COMPANIES
// ========================

export async function createCompany(companyData) {
  const mode = resolveDatabaseMode();
  const { product_category, comp_prof_image, gst_no, cname, pincode, city, state, address_line1, address_line2 } = companyData;

  if (mode === "file") {
    return createCompanyRecord({
      product_category, comp_prof_image, gst_no, cname, pincode, city, state, address_line1, address_line2
    });
  }

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
  const mode = resolveDatabaseMode();
  if (mode === "file") return findCompanyByIdFromStore(id);
  
  const pool = getPool();
  const result = await pool.query(SELECT_COMPANY_BY_ID_QUERY, [id]);
  return result.rows[0] || null;
}
