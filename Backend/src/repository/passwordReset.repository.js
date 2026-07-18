import { getPool } from "../config/database.js";

/**
 * Inserts or updates a password reset token for a given email.
 */
export async function upsertPasswordReset(email, token, expiresAt) {
  const pool = getPool();
  const query = `
    INSERT INTO password_resets (email, token, expires_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (email)
    DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, created_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const result = await pool.query(query, [email.toLowerCase().trim(), token, expiresAt]);
  return result.rows[0];
}

/**
 * Finds a password reset record by token.
 */
export async function findPasswordResetByToken(token) {
  const pool = getPool();
  const query = `
    SELECT email, token, expires_at
    FROM password_resets
    WHERE token = $1
    LIMIT 1;
  `;
  const result = await pool.query(query, [token]);
  return result.rows[0] || null;
}

/**
 * Deletes a password reset record by email.
 */
export async function deletePasswordResetByEmail(email) {
  const pool = getPool();
  const query = `
    DELETE FROM password_resets
    WHERE LOWER(email) = LOWER($1)
    RETURNING *;
  `;
  const result = await pool.query(query, [email.trim()]);
  return result.rows[0] || null;
}
