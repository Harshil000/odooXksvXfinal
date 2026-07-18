import { getPool } from "../config/database.js";
import { resolveDatabaseMode } from "../database/dbMode.js";
import {
  INSERT_ADDRESS_QUERY,
  SELECT_ADDRESSES_BY_USER_ID_QUERY,
  UPDATE_ADDRESS_QUERY,
  DELETE_ADDRESS_QUERY
} from "../queries/address.query.js";

export async function createAddress({ pincode, state, city, address_line1, address_line2, u_id }) {
  const mode = resolveDatabaseMode();
  if (mode === "file") throw new Error("File mode for addresses not implemented");

  const pool = getPool();
  const result = await pool.query(INSERT_ADDRESS_QUERY, [
    pincode, state, city, address_line1, address_line2 || null, u_id
  ]);
  return result.rows[0];
}

export async function findAddressesByUserId(u_id) {
  const mode = resolveDatabaseMode();
  if (mode === "file") throw new Error("File mode for addresses not implemented");

  const pool = getPool();
  const result = await pool.query(SELECT_ADDRESSES_BY_USER_ID_QUERY, [u_id]);
  return result.rows;
}

export async function updateAddress(address_id, u_id, { pincode, state, city, address_line1, address_line2 }) {
  const mode = resolveDatabaseMode();
  if (mode === "file") throw new Error("File mode for addresses not implemented");

  const pool = getPool();
  const result = await pool.query(UPDATE_ADDRESS_QUERY, [
    pincode, state, city, address_line1, address_line2 || null, address_id, u_id
  ]);
  return result.rows[0];
}

export async function deleteAddress(address_id, u_id) {
  const mode = resolveDatabaseMode();
  if (mode === "file") throw new Error("File mode for addresses not implemented");

  const pool = getPool();
  const result = await pool.query(DELETE_ADDRESS_QUERY, [address_id, u_id]);
  return result.rows[0];
}
